import { createAdminClient } from "@/lib/supabase/admin";
import { chatSync } from "@/lib/ai/claude";
import { notify } from "@/lib/notify";
import { enqueueJob } from "@/lib/jobs/enqueue";
import { runAgentStep } from "./helpers";

/**
 * Agent 2 — Post-consult Dispatcher.
 *
 * Trigger:  consultation.finalized  (enqueued via lib/jobs/enqueue.ts)
 * Work:
 *   1. Load consultation (SOAP, Rx, ICD-10, chief complaint).
 *   2. Rewrite the clinical SOAP as plain-English patient summary (Claude).
 *   3. Send consultation_summary on email (WhatsApp + SMS deferred — they
 *      simulate unless provider keys are wired; see lib/notify/*.ts).
 *   4. Schedule the follow-up threads (default day-1/3/7) — one
 *      larinova_follow_up_threads row + one followup.scheduled job each.
 *      (The worker polls `scheduled_for <= now()` and only dispatches then.)
 *   5. Emit narrative.regenerate so the Patient Narrative agent can refresh
 *      the doctor-facing summary.
 */

const PATIENT_SOAP_PROMPT = `You are writing a one-paragraph summary of a medical consultation for a
non-clinical audience (the patient themselves). Rules:
- Plain English. No jargon. No Latin. If you must use a technical term, define it in plain words.
- One paragraph, 4-6 sentences.
- Cover: what the doctor diagnosed, what the plan is, and when to worry.
- Do NOT include medication dosages — the attached prescription PDF covers that.
- Close with a line on when to check back in.

Return ONLY the paragraph, no preamble, no JSON.`;

const DEFAULT_FOLLOW_UP: Array<"day-1" | "day-3" | "day-7"> = [
  "day-1",
  "day-3",
  "day-7",
];

export interface DispatcherRunPayload {
  consultationId: string;
}

export interface DispatcherRunResult {
  skipped?: boolean;
  consultationId?: string;
  patientId?: string;
  followUpsScheduled?: number;
}

export async function run(
  payload: DispatcherRunPayload,
): Promise<DispatcherRunResult> {
  const { consultationId } = payload;
  if (!consultationId) return { skipped: true };

  // load-consultation
  const ctx = await loadConsultationContext(consultationId);
  if (!ctx) return { skipped: true };

  // generate-plain-summary
  const plainSummary = await runAgentStep(
    {
      agent: "dispatcher",
      step: "plain-summary",
      event: "consultation.finalized",
      correlationId: consultationId,
      patientId: ctx.patient.id,
    },
    async () => ({
      result: await generatePlainSummary(ctx),
      model: "sonnet",
    }),
  );

  // render-rx-pdf
  const rxPdfUrl = await renderAndUploadRx(ctx);

  // notify-all-channels
  await sendAllChannels(ctx, plainSummary, rxPdfUrl);

  // schedule-followups (writes DB rows + enqueues one job per tier)
  const scheduledCount = await scheduleFollowUps(ctx);

  // emit-narrative-regenerate
  await enqueueJob("narrative.regenerate", { patientId: ctx.patient.id });

  return {
    consultationId,
    patientId: ctx.patient.id,
    followUpsScheduled: scheduledCount,
  };
}

// ──────────────────────────────────────────────────────────────────────────

interface DispatcherContext {
  consultation: {
    id: string;
    doctor_id: string;
    patient_id: string;
    diagnosis: string | null;
    summary: string | null;
    doctor_notes: string | null;
    chief_complaint: string | null;
    created_at: string;
  };
  doctor: { id: string; full_name: string; email: string | null };
  patient: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  prescription: {
    id: string;
    prescription_code: string;
    items: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string | null;
      quantity?: number | null;
    }>;
  } | null;
  followUpSchedule: Array<"day-1" | "day-3" | "day-7">;
}

async function loadConsultationContext(
  consultationId: string,
): Promise<DispatcherContext | null> {
  const supabase = createAdminClient();

  const { data: consultation } = await supabase
    .from("larinova_consultations")
    .select(
      "id, doctor_id, patient_id, diagnosis, summary, doctor_notes, chief_complaint, created_at, follow_up_schedule",
    )
    .eq("id", consultationId)
    .maybeSingle();

  if (!consultation || !consultation.patient_id) return null;

  const [doctorRes, patientRes, rxRes] = await Promise.all([
    supabase
      .from("larinova_doctors")
      .select("id, full_name, email")
      .eq("id", consultation.doctor_id)
      .maybeSingle(),
    supabase
      .from("larinova_patients")
      .select("id, full_name, email, phone")
      .eq("id", consultation.patient_id)
      .maybeSingle(),
    supabase
      .from("larinova_prescriptions")
      .select("id, prescription_code")
      .eq("consultation_id", consultationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!doctorRes.data || !patientRes.data) return null;

  let prescription: DispatcherContext["prescription"] = null;
  if (rxRes.data) {
    const { data: items } = await supabase
      .from("larinova_prescription_items")
      .select(
        "medicine_name, dosage, frequency, duration, instructions, quantity",
      )
      .eq("prescription_id", rxRes.data.id);
    prescription = {
      id: rxRes.data.id,
      prescription_code: rxRes.data.prescription_code,
      items: (items ?? []) as DispatcherContext["prescription"] extends null
        ? never
        : NonNullable<DispatcherContext["prescription"]>["items"],
    };
  }

  const followUpSchedule = Array.isArray(
    (consultation as { follow_up_schedule?: unknown }).follow_up_schedule,
  )
    ? ((
        consultation as { follow_up_schedule: string[] }
      ).follow_up_schedule.filter(
        (t) => t === "day-1" || t === "day-3" || t === "day-7",
      ) as Array<"day-1" | "day-3" | "day-7">)
    : DEFAULT_FOLLOW_UP;

  return {
    consultation,
    doctor: doctorRes.data,
    patient: patientRes.data,
    prescription,
    followUpSchedule,
  };
}

async function generatePlainSummary(ctx: DispatcherContext): Promise<string> {
  const prompt = `${PATIENT_SOAP_PROMPT}

Clinical SOAP summary:
${ctx.consultation.summary ?? "(no summary recorded)"}

Diagnosis: ${ctx.consultation.diagnosis ?? "(unspecified)"}
Doctor notes: ${ctx.consultation.doctor_notes ?? ""}
Chief complaint: ${ctx.consultation.chief_complaint ?? ""}
`;
  const res = await chatSync({ prompt, model: "sonnet" });
  return res.text.trim();
}

/**
 * Render prescription PDF via existing renderer + upload to patient-documents.
 * For v1 we lean on a deferred implementation — if a renderer fn isn't wired,
 * we return a null URL and the templates render without the attachment.
 * Real PDF generation is owned by the existing lib/prescription/ module.
 */
async function renderAndUploadRx(
  ctx: DispatcherContext,
): Promise<string | null> {
  if (!ctx.prescription) return null;
  const storagePath = `patient-documents/${ctx.patient.id}/${ctx.prescription.prescription_code}.pdf`;

  const supabase = createAdminClient();
  await supabase.from("larinova_patient_documents").insert({
    patient_id: ctx.patient.id,
    consultation_id: ctx.consultation.id,
    uploader: "agent",
    kind: "prescription",
    storage_path: storagePath,
    original_filename: `${ctx.prescription.prescription_code}.pdf`,
    mime_type: "application/pdf",
  });

  // Public URL is resolved by the patient portal's signed-URL route at
  // /documents/:id. For v1 we pass the portal URL; the portal renders the
  // actual PDF from the storage bucket using its magic-link session.
  const portalBase =
    process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL ??
    "https://patient.larinova.com";
  return `${portalBase}/prescriptions/${ctx.prescription.id}`;
}

async function sendAllChannels(
  ctx: DispatcherContext,
  plainSummary: string,
  rxPdfUrl: string | null,
): Promise<void> {
  const consultationDate = ctx.consultation.created_at.slice(0, 10);
  const portalUrl =
    process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL ??
    "https://patient.larinova.com";

  const baseData = {
    patientName: ctx.patient.full_name,
    doctorName: ctx.doctor.full_name,
    consultationDate,
    plainSummary,
    diagnosis: ctx.consultation.diagnosis ?? undefined,
    portalUrl,
  };

  const recipient = {
    patientId: ctx.patient.id,
    email: ctx.patient.email ?? undefined,
    phone: ctx.patient.phone ?? undefined,
    whatsapp: ctx.patient.phone ?? undefined,
    name: ctx.patient.full_name,
  };

  if (recipient.email) {
    await notify("email", "consultation_summary", baseData, recipient, {
      relatedEntityType: "consultation",
      relatedEntityId: ctx.consultation.id,
    });
  }
  if (recipient.whatsapp) {
    await notify(
      "whatsapp",
      "consultation_summary",
      { ...baseData, rxPdfUrl: rxPdfUrl ?? undefined },
      recipient,
      {
        relatedEntityType: "consultation",
        relatedEntityId: ctx.consultation.id,
      },
    );
  }
  if (recipient.phone) {
    await notify(
      "sms",
      "consultation_summary",
      { ...baseData, portalShortLink: portalUrl },
      recipient,
      {
        relatedEntityType: "consultation",
        relatedEntityId: ctx.consultation.id,
      },
    );
  }
}

async function scheduleFollowUps(ctx: DispatcherContext): Promise<number> {
  const supabase = createAdminClient();
  const tierOffsets: Record<"day-1" | "day-3" | "day-7", number> = {
    "day-1": 1,
    "day-3": 3,
    "day-7": 7,
  };

  let scheduled = 0;
  for (const tier of ctx.followUpSchedule) {
    const scheduledFor = new Date();
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + tierOffsets[tier]);

    const { data: thread, error } = await supabase
      .from("larinova_follow_up_threads")
      .insert({
        patient_id: ctx.patient.id,
        doctor_id: ctx.doctor.id,
        consultation_id: ctx.consultation.id,
        tier,
        scheduled_for: scheduledFor.toISOString(),
        status: "scheduled",
      })
      .select("id")
      .single();

    if (error || !thread) continue;

    // Previously: inngest.send('followup.scheduled'). Now we insert a
    // pending job; the worker will dispatch it when scheduled_for <= now().
    await enqueueJob("followup.scheduled", { threadId: thread.id, tier });
    scheduled += 1;
  }
  return scheduled;
}
