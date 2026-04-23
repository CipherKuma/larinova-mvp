import { createAdminClient } from "@/lib/supabase/admin";
import { chatSync, extractJson } from "@/lib/ai/claude";
import { notify } from "@/lib/notify";
import { runAgentStep } from "./helpers";

/**
 * Agent 1 — Pre-consult Intake AI.
 *
 * Trigger:  intake.submitted  (enqueued via lib/jobs/enqueue.ts)
 * Inputs:   appointment + intake submission + patient history
 * Output:   prep_brief written to larinova_appointments.prep_brief,
 *           intake.prep_ready enqueued for the next stage.
 *
 * Loop:     up to MAX_ROUNDS (3) rounds of AI follow-up. Each round sends an
 *           intake_info_request via WhatsApp (falling back to email).
 *
 * Durable-wait note (Inngest deferral):
 *   Previously we called step.waitForEvent('intake.info_received', {timeout:48h})
 *   to pause for the patient's reply. That runtime is gone — the worker now
 *   re-enqueues `intake.submitted` each time a fresh reply lands (via webhook
 *   inserting `intake.info_received` → dispatch re-runs `intake.submitted`).
 *   This function runs its full loop-body ONCE per invocation: evaluate → if
 *   not ready and rounds < MAX_ROUNDS, send a follow-up prompt and exit. If
 *   ready OR we're out of rounds, write the prep brief and emit prep_ready.
 *
 * Guardrails (enforced via the Claude system prompt):
 *  - Never ask for gov IDs, bank info, unrelated PII.
 *  - Always include "skip — tell the doctor in person" option.
 */

const MAX_ROUNDS = 3;

interface IntakeEvaluation {
  ready: boolean;
  questions: string[];
  documents_requested: string[];
  summary: string;
}

interface PrepBrief {
  summary: string;
  red_flags: string[];
  suggested_questions: string[];
  medications_to_review: string[];
}

const SYSTEM_PROMPT = `You are a clinical intake assistant for an Indian outpatient (OPD) clinic.
A patient has booked an appointment and filled an intake form. Your job: decide
whether the doctor has enough information to run a good first consult, OR
whether you should ask the patient 1-3 specific pre-consult questions.

RULES:
- Never ask for government IDs, bank info, or PII unrelated to the chief complaint.
- Always include "you can also skip — tell the doctor in person" as an option
  in any message the patient receives (the template adds this automatically,
  so your questions should be direct and clinical).
- If the intake already covers chief complaint, duration, prior meds, and
  any known allergies, return ready=true.
- Prefer 1-2 well-chosen questions over a long list. Never exceed 3.
- When requesting documents, be specific: "photo of the rash" > "picture".

RETURN ONLY JSON matching this TypeScript type:
{ ready: boolean; questions: string[]; documents_requested: string[]; summary: string }
`;

const PREP_BRIEF_PROMPT = `You are briefing a doctor for an outpatient consultation that is about to start.
Write the Prep Brief the doctor will read in the 60 seconds before opening the
consult. Return ONLY JSON matching this TypeScript type:
{ summary: string; red_flags: string[]; suggested_questions: string[]; medications_to_review: string[] }

- summary: 2-3 sentences, plain English, doctor-facing. Lead with chief complaint + duration.
- red_flags: any symptoms or history that need urgent attention (empty array if none).
- suggested_questions: 2-4 concrete questions to ask during the consult, tailored to the patient.
- medications_to_review: current meds the patient reports. Empty array if none known.
`;

export interface IntakeRunPayload {
  appointmentId: string;
}

export interface IntakeRunResult {
  skipped?: boolean;
  reason?: string;
  appointmentId?: string;
  rounds?: number;
  ready?: boolean;
  awaitingReply?: boolean;
}

export async function run(payload: IntakeRunPayload): Promise<IntakeRunResult> {
  const { appointmentId } = payload;
  if (!appointmentId) return { skipped: true, reason: "missing appointmentId" };

  // load-intake-context
  const { appointment, submission, patient } =
    await loadIntakeContext(appointmentId);
  if (!appointment || !submission || !patient) {
    return { skipped: true, reason: "missing context" };
  }

  const rounds = submission.ai_followup_rounds ?? 0;

  // evaluate-intake
  const evaluation = await runAgentStep(
    {
      agent: "intake",
      step: `evaluate-${rounds}`,
      event: "intake.submitted",
      correlationId: appointmentId,
      patientId: patient.id,
      payload: { round: rounds },
    },
    async () => ({
      result: await evaluateIntake(patient, appointment, submission),
      model: "sonnet",
    }),
  );

  // If the intake is not yet ready and we still have rounds available,
  // send a follow-up prompt and exit. The worker will re-dispatch this
  // agent when `intake.info_received` is enqueued (webhook path) or on
  // a manual re-run.
  if (!evaluation.ready && rounds < MAX_ROUNDS) {
    // send-info-request
    await sendIntakeInfoRequest(patient, appointment, evaluation);

    // bump-rounds
    const supabase = createAdminClient();
    await supabase
      .from("larinova_intake_submissions")
      .update({ ai_followup_rounds: rounds + 1 })
      .eq("id", submission.id);

    return {
      appointmentId,
      rounds: rounds + 1,
      ready: false,
      awaitingReply: true,
    };
  }

  // generate-prep-brief
  const prep = await runAgentStep(
    {
      agent: "intake",
      step: "generate-prep-brief",
      event: "intake.submitted",
      correlationId: appointmentId,
      patientId: patient.id,
    },
    async () => ({
      result: await generatePrepBrief(
        patient,
        appointment,
        submission,
        evaluation,
      ),
      model: "sonnet",
    }),
  );

  // save-prep-brief
  const supabase = createAdminClient();
  await supabase
    .from("larinova_appointments")
    .update({ prep_brief: prep, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);
  await supabase
    .from("larinova_intake_submissions")
    .update({ ai_ready: true })
    .eq("id", submission.id);

  // emit-prep-ready — previously an inngest event; now we no longer
  // chain a downstream agent here. (The dispatcher fires on consultation
  // finalization, not on intake readiness.) If/when we need a hook for
  // prep-ready we'd enqueue a dedicated job type via enqueueJob().

  return { appointmentId, rounds, ready: evaluation.ready };
}

// ──────────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  appointment_date: string;
  start_time: string;
  chief_complaint: string | null;
  locale: string;
}
interface Submission {
  id: string;
  form_data: Record<string, unknown>;
  ai_followup_rounds: number;
}
interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
}

async function loadIntakeContext(appointmentId: string): Promise<{
  appointment: Appointment | null;
  submission: Submission | null;
  patient: Patient | null;
}> {
  const supabase = createAdminClient();
  const { data: appointment } = await supabase
    .from("larinova_appointments")
    .select(
      "id, doctor_id, patient_id, appointment_date, start_time, chief_complaint, locale",
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment)
    return { appointment: null, submission: null, patient: null };

  const { data: submission } = await supabase
    .from("larinova_intake_submissions")
    .select("id, form_data, ai_followup_rounds")
    .eq("appointment_id", appointmentId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const patientId = appointment.patient_id;
  const { data: patient } = patientId
    ? await supabase
        .from("larinova_patients")
        .select("id, full_name, email, phone")
        .eq("id", patientId)
        .maybeSingle()
    : { data: null as Patient | null };

  return {
    appointment: appointment as Appointment,
    submission: submission as Submission | null,
    patient: patient as Patient | null,
  };
}

async function evaluateIntake(
  patient: Patient,
  appointment: Appointment,
  submission: Submission,
): Promise<IntakeEvaluation> {
  const prompt = `${SYSTEM_PROMPT}

Patient: ${patient.full_name}
Chief complaint: ${appointment.chief_complaint ?? "(not captured)"}
Appointment: ${appointment.appointment_date} ${appointment.start_time}

Intake form data:
${JSON.stringify(submission.form_data, null, 2)}

Decide: is this enough? If not, what 1-3 questions should we ask?`;

  const res = await chatSync({ prompt, model: "sonnet" });
  return extractJson<IntakeEvaluation>(res.text);
}

async function sendIntakeInfoRequest(
  patient: Patient,
  appointment: Appointment,
  evaluation: IntakeEvaluation,
): Promise<void> {
  const data = {
    patientName: patient.full_name,
    doctorName: "your doctor", // populated with doctor name in prod via join
    questions: evaluation.questions,
    documentsRequested: evaluation.documents_requested,
    portalUrl: process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL,
  };

  if (patient.phone) {
    await notify(
      "whatsapp",
      "intake_info_request",
      data,
      {
        patientId: patient.id,
        phone: patient.phone,
        whatsapp: patient.phone,
        name: patient.full_name,
      },
      { relatedEntityType: "appointment", relatedEntityId: appointment.id },
    );
  }
  if (patient.email) {
    await notify(
      "email",
      "intake_info_request",
      data,
      { patientId: patient.id, email: patient.email, name: patient.full_name },
      { relatedEntityType: "appointment", relatedEntityId: appointment.id },
    );
  }
}

async function generatePrepBrief(
  patient: Patient,
  appointment: Appointment,
  submission: Submission,
  evaluation: IntakeEvaluation | null,
): Promise<PrepBrief> {
  const prompt = `${PREP_BRIEF_PROMPT}

Patient: ${patient.full_name}
Chief complaint: ${appointment.chief_complaint ?? "(not captured)"}

Intake form data:
${JSON.stringify(submission.form_data, null, 2)}

Latest AI evaluation:
${evaluation ? JSON.stringify(evaluation, null, 2) : "(none)"}
`;
  const res = await chatSync({ prompt, model: "sonnet" });
  return extractJson<PrepBrief>(res.text);
}
