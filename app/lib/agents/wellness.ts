import { createAdminClient } from "@/lib/supabase/admin";
import { chatSync, extractJson } from "@/lib/ai/claude";
import { notify } from "@/lib/notify";
import { enqueueJob } from "@/lib/jobs/enqueue";
import { runAgentStep } from "./helpers";
import type { TemplateKey } from "@/lib/notify";

/**
 * Agent 3 — Wellness Follow-up Agent.
 *
 * Two entrypoints, both invoked by the out-of-process worker
 * (scripts/worker.ts) based on the job type enqueued in larinova_agent_jobs:
 *
 *  A) runSend({threadId, tier})     — triggered by a followup.scheduled job
 *                                      after the worker notices scheduled_for
 *                                      <= now(). Sends the opening message.
 *  B) runReply({threadId, body})    — triggered by a followup.message_received
 *                                      job inserted by the Gupshup webhook.
 *
 * Durable-wait note:
 *   Previously these were dual Inngest functions with step.sleepUntil for the
 *   day-1/3/7 cold wait. The worker now scans follow_up_threads.scheduled_for
 *   and enqueues followup.scheduled only when the time arrives — the agent
 *   itself does no waiting. For the 48h inbound-reply pause between probes,
 *   the agent exits after sending a probe; when the next inbound lands the
 *   webhook enqueues followup.message_received and we resume.
 *
 * Guardrails:
 *   - Hard cap at 10 exchanges per thread.
 *   - STOP keyword → opt-out.
 *   - Patient replies classified: improving | unchanged | flagged.
 */

const MAX_EXCHANGES = 10;

const CLASSIFY_PROMPT = `You are a wellness follow-up assistant messaging a patient over WhatsApp
after an outpatient consult. Read the full transcript. Decide:
  action:         "probe" | "escalate" | "close"
  body:           next message to send the patient (empty if close)
  classification: "improving" | "unchanged" | "flagged"

Rules:
- probe: patient reply is ambiguous or needs more detail. Ask ONE concise follow-up question.
- escalate: patient reports worsening symptoms, new red flags (e.g. breathing trouble, chest pain, fainting, blood), or mentions they want the doctor. Set classification=flagged. The body should be empathetic + say we're letting the doctor know.
- close: patient confirms improvement or says they're done. classification=improving or unchanged.
- Keep body under 300 chars. Plain English. Empathetic tone.
- NEVER recommend medication changes. NEVER diagnose.

Return ONLY JSON: { action, body, classification }`;

// ──────────────────────────────────────────────────────────────────────────
// A — scheduled send
// ──────────────────────────────────────────────────────────────────────────

export interface WellnessSendPayload {
  threadId: string;
  tier: "day-1" | "day-3" | "day-7";
}

export async function runSend(payload: WellnessSendPayload) {
  const { threadId, tier } = payload;

  // load-thread
  const ctx = await loadThread(threadId);
  if (!ctx) return { skipped: true };

  // The worker only enqueues this job once scheduled_for has already passed,
  // so no await-scheduled-time sleep is needed here.

  // generate-opening
  const promptBody = await runAgentStep(
    {
      agent: "wellness",
      step: "opening",
      event: "followup.scheduled",
      correlationId: threadId,
      patientId: ctx.patient.id,
      payload: { tier },
    },
    async () => ({
      result: await generateOpening(ctx, tier),
      model: "sonnet",
    }),
  );

  const templateKey = templateFor(tier);
  // send-opening
  await notify(
    "whatsapp",
    templateKey,
    {
      patientName: ctx.patient.full_name,
      doctorName: ctx.doctor.full_name,
      chiefComplaint: ctx.consultation.chief_complaint ?? undefined,
      promptBody,
    },
    {
      patientId: ctx.patient.id,
      phone: ctx.patient.phone ?? undefined,
      whatsapp: ctx.patient.phone ?? undefined,
      name: ctx.patient.full_name,
    },
    { relatedEntityType: "follow_up_thread", relatedEntityId: threadId },
  );

  // mark-active
  await appendTranscript(threadId, "agent", promptBody, { status: "active" });

  return { threadId, tier, sent: true };
}

// ──────────────────────────────────────────────────────────────────────────
// B — inbound reply handler
// ──────────────────────────────────────────────────────────────────────────

export interface WellnessReplyPayload {
  threadId: string;
  body: string;
}

export async function runReply(payload: WellnessReplyPayload) {
  const { threadId, body } = payload;

  // load-thread-reply
  const ctx = await loadThread(threadId);
  if (!ctx) return { skipped: true };

  if (ctx.thread.patient_opted_out || ctx.thread.status === "closed") {
    return { skipped: true, reason: "thread closed" };
  }

  // STOP opt-out — short-circuit without Claude.
  if (isStop(body)) {
    // opt-out
    await appendTranscript(threadId, "patient", body, {
      status: "opted_out",
      patient_opted_out: true,
      outcome: "closed",
    });
    return { threadId, optedOut: true };
  }

  // record-inbound
  await appendTranscript(threadId, "patient", body);

  // Hard exchange cap.
  if (ctx.thread.exchanges_count + 1 >= MAX_EXCHANGES) {
    // hard-cap-close
    await appendTranscript(
      threadId,
      "agent",
      "Thanks — I'll check back with you and loop in your doctor if needed.",
      { status: "closed", outcome: "unchanged" },
    );
    return { threadId, closed: true, reason: "max-exchanges" };
  }

  // classify-reply
  const decision = await runAgentStep(
    {
      agent: "wellness",
      step: "classify",
      event: "followup.message_received",
      correlationId: threadId,
      patientId: ctx.patient.id,
      payload: { body },
    },
    async () => ({
      result: await classifyReply(ctx, body),
      model: "sonnet",
    }),
  );

  if (decision.action === "escalate") {
    // escalate-flag
    await flagThread(ctx, threadId, decision.body, decision.classification);
    // emit-flagged — enqueue so any downstream consumer can react.
    await enqueueJob("followup.message_received", {
      threadId,
      _flagged: true,
    });
    return { threadId, flagged: true };
  }

  if (decision.action === "close") {
    // close-thread
    await appendTranscript(threadId, "agent", decision.body || "Take care!", {
      status: "closed",
      outcome: decision.classification,
    });
    if (decision.body) {
      // send-close-msg
      await sendAgentMessage(ctx, threadId, decision.body);
    }
    return { threadId, closed: true };
  }

  // probe — send reply, wait for next inbound (webhook will enqueue).
  // send-probe
  await sendAgentMessage(ctx, threadId, decision.body);
  // save-probe-transcript
  await appendTranscript(threadId, "agent", decision.body, {
    outcome: decision.classification,
  });
  return { threadId, probed: true };
}

// ──────────────────────────────────────────────────────────────────────────

interface WellnessContext {
  thread: {
    id: string;
    patient_id: string;
    doctor_id: string | null;
    consultation_id: string;
    tier: "day-1" | "day-3" | "day-7";
    scheduled_for: string;
    status: string;
    transcript: Array<{ role: "agent" | "patient"; body: string; at: string }>;
    exchanges_count: number;
    patient_opted_out: boolean;
  };
  patient: { id: string; full_name: string; phone: string | null };
  doctor: { id: string; full_name: string; email: string | null };
  consultation: { id: string; chief_complaint: string | null };
}

async function loadThread(threadId: string): Promise<WellnessContext | null> {
  const supabase = createAdminClient();
  const { data: thread } = await supabase
    .from("larinova_follow_up_threads")
    .select(
      "id, patient_id, doctor_id, consultation_id, tier, scheduled_for, status, transcript, exchanges_count, patient_opted_out",
    )
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || !thread.patient_id) return null;

  const [p, d, c] = await Promise.all([
    supabase
      .from("larinova_patients")
      .select("id, full_name, phone")
      .eq("id", thread.patient_id)
      .maybeSingle(),
    thread.doctor_id
      ? supabase
          .from("larinova_doctors")
          .select("id, full_name, email")
          .eq("id", thread.doctor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("larinova_consultations")
      .select("id, chief_complaint")
      .eq("id", thread.consultation_id)
      .maybeSingle(),
  ]);

  if (!p.data || !d.data || !c.data) return null;

  return {
    thread: thread as WellnessContext["thread"],
    patient: p.data,
    doctor: d.data,
    consultation: c.data,
  };
}

async function generateOpening(
  ctx: WellnessContext,
  tier: "day-1" | "day-3" | "day-7",
): Promise<string> {
  const prompt = `You are opening a wellness follow-up with a patient over WhatsApp.
Patient: ${ctx.patient.full_name}
Doctor: Dr. ${ctx.doctor.full_name}
Chief complaint at consult: ${ctx.consultation.chief_complaint ?? "(unspecified)"}
Tier: ${tier}

Write ONE short, warm message (under 280 chars). Mention the doctor by name,
reference the chief complaint if known, and end with a concrete question.
No emojis. Return ONLY the message text.`;
  const res = await chatSync({ prompt, model: "sonnet" });
  return res.text.trim().replace(/^[\s"']+|[\s"']+$/g, "");
}

async function classifyReply(
  ctx: WellnessContext,
  inbound: string,
): Promise<{
  action: "probe" | "escalate" | "close";
  body: string;
  classification: "improving" | "unchanged" | "flagged";
}> {
  const transcript = ctx.thread.transcript
    .concat([{ role: "patient", body: inbound, at: new Date().toISOString() }])
    .map((m) => `${m.role.toUpperCase()}: ${m.body}`)
    .join("\n");

  const prompt = `${CLASSIFY_PROMPT}

Context:
- Patient: ${ctx.patient.full_name}
- Doctor: Dr. ${ctx.doctor.full_name}
- Chief complaint: ${ctx.consultation.chief_complaint ?? "(unspecified)"}
- Tier: ${ctx.thread.tier}

Transcript so far:
${transcript}
`;
  const res = await chatSync({ prompt, model: "sonnet" });
  return extractJson(res.text);
}

function templateFor(tier: "day-1" | "day-3" | "day-7"): TemplateKey {
  return tier === "day-1"
    ? "followup_prompt_day1"
    : tier === "day-3"
      ? "followup_prompt_day3"
      : "followup_prompt_day7";
}

async function sendAgentMessage(
  ctx: WellnessContext,
  threadId: string,
  body: string,
): Promise<void> {
  await notify(
    "whatsapp",
    templateFor(ctx.thread.tier),
    {
      patientName: ctx.patient.full_name,
      doctorName: ctx.doctor.full_name,
      chiefComplaint: ctx.consultation.chief_complaint ?? undefined,
      promptBody: body,
    },
    {
      patientId: ctx.patient.id,
      phone: ctx.patient.phone ?? undefined,
      whatsapp: ctx.patient.phone ?? undefined,
      name: ctx.patient.full_name,
    },
    { relatedEntityType: "follow_up_thread", relatedEntityId: threadId },
  );
}

async function appendTranscript(
  threadId: string,
  role: "agent" | "patient",
  body: string,
  extra: Partial<{
    status: string;
    outcome: string;
    patient_opted_out: boolean;
  }> = {},
): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("larinova_follow_up_threads")
    .select("transcript, exchanges_count")
    .eq("id", threadId)
    .maybeSingle();
  const transcript = Array.isArray(data?.transcript) ? data!.transcript : [];
  transcript.push({ role, body, at: new Date().toISOString() });

  await supabase
    .from("larinova_follow_up_threads")
    .update({
      transcript,
      exchanges_count: (data?.exchanges_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", threadId);
}

async function flagThread(
  ctx: WellnessContext,
  threadId: string,
  agentBody: string,
  classification: string,
): Promise<void> {
  const supabase = createAdminClient();

  const transcript = ctx.thread.transcript
    .slice(-6)
    .map((m) => `${m.role}: ${m.body}`)
    .join("\n");

  await supabase
    .from("larinova_follow_up_threads")
    .update({
      flagged: true,
      doctor_notified_at: new Date().toISOString(),
      outcome: "flagged",
      status: "active",
    })
    .eq("id", threadId);

  if (agentBody) {
    await sendAgentMessage(ctx, threadId, agentBody);
    await appendTranscript(threadId, "agent", agentBody, {
      outcome: "flagged",
    });
  }

  if (ctx.doctor.email) {
    await notify(
      "email",
      "followup_flagged_doctor",
      {
        doctorName: ctx.doctor.full_name,
        patientName: ctx.patient.full_name,
        tier: ctx.thread.tier,
        reason: `classification=${classification}`,
        transcriptSnippet: transcript,
      },
      { doctorId: ctx.doctor.id, email: ctx.doctor.email },
      { relatedEntityType: "follow_up_thread", relatedEntityId: threadId },
    );
  }
  await notify(
    "in_app",
    "followup_flagged_doctor",
    {
      doctorName: ctx.doctor.full_name,
      patientName: ctx.patient.full_name,
      tier: ctx.thread.tier,
      reason: `classification=${classification}`,
      transcriptSnippet: transcript,
    },
    { doctorId: ctx.doctor.id },
    { relatedEntityType: "follow_up_thread", relatedEntityId: threadId },
  );
}

function isStop(body: string): boolean {
  return /^\s*stop\s*$/i.test(body);
}
