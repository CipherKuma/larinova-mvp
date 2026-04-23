import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatSync } from "@/lib/ai/claude";
import { runAgentStep } from "./helpers";

/**
 * Agent 4 — Patient Narrative.
 *
 * Trigger:  narrative.regenerate (emitted by the dispatcher on every
 *           consultation.finalized).
 *
 * Produces a 3-5 sentence doctor-facing summary and UPSERTs into
 * larinova_patient_narrative. Uses the patient's last 5 consultations plus
 * any known allergies / chronic conditions (columns may not exist yet on
 * larinova_patients — we read defensively).
 */

const NARRATIVE_PROMPT = `You are writing a condensed doctor-facing summary for a returning patient.
Format: 3-5 sentences, plain English, clinical but concise. Lead with the
most load-bearing context a doctor should recall in the 10 seconds before
walking into the room. Mention pattern over time when it's present
(recurrence, escalation, improvement). No bullet points. No headings.

Return ONLY the paragraph.`;

export const narrativeAgent = inngest.createFunction(
  {
    id: "agent-narrative",
    retries: 2,
    triggers: [{ event: "narrative.regenerate" }],
  },
  async ({ event, step }) => {
    const { patientId } = (event.data ?? {}) as { patientId: string };

    const ctx = await step.run("load-patient-history", () =>
      loadPatientHistory(patientId),
    );
    if (!ctx) return { skipped: true };

    const summary = await step.run("generate-narrative", () =>
      runAgentStep(
        {
          agent: "narrative",
          step: "generate",
          event: "narrative.regenerate",
          correlationId: patientId,
          patientId,
        },
        async () => ({
          result: await generateNarrative(ctx),
          model: "sonnet",
        }),
      ),
    );

    await step.run("upsert-narrative", () =>
      saveNarrative(patientId, summary, ctx.sourceIds),
    );
    return { patientId, sources: ctx.sourceIds.length };
  },
);

// ──────────────────────────────────────────────────────────────────────────

interface NarrativeContext {
  patient: {
    id: string;
    full_name: string;
    date_of_birth?: string | null;
    gender?: string | null;
  };
  consultations: Array<{
    id: string;
    created_at: string;
    chief_complaint: string | null;
    diagnosis: string | null;
    summary: string | null;
    doctor_notes: string | null;
  }>;
  allergies?: string | null;
  chronic?: string | null;
  sourceIds: string[];
}

async function loadPatientHistory(
  patientId: string,
): Promise<NarrativeContext | null> {
  const supabase = createAdminClient();

  const { data: patient } = await supabase
    .from("larinova_patients")
    .select(
      "id, full_name, date_of_birth, gender, allergies, chronic_conditions",
    )
    .eq("id", patientId)
    .maybeSingle();

  if (!patient) return null;

  const { data: consultations } = await supabase
    .from("larinova_consultations")
    .select("id, created_at, chief_complaint, diagnosis, summary, doctor_notes")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(5);

  const list = consultations ?? [];
  return {
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth ?? null,
      gender: patient.gender ?? null,
    },
    consultations: list,
    allergies: (patient as { allergies?: string | null }).allergies ?? null,
    chronic:
      (patient as { chronic_conditions?: string | null }).chronic_conditions ??
      null,
    sourceIds: list.map((c) => c.id),
  };
}

async function generateNarrative(ctx: NarrativeContext): Promise<string> {
  const consultsText = ctx.consultations
    .map((c, i) => {
      const date = (c.created_at ?? "").slice(0, 10);
      const parts = [
        `${i + 1}. ${date} — ${c.chief_complaint ?? "(no chief complaint)"}`,
        c.diagnosis ? `Dx: ${c.diagnosis}` : null,
        c.summary ? `Summary: ${c.summary}` : null,
      ].filter(Boolean);
      return parts.join(" · ");
    })
    .join("\n");

  const prompt = `${NARRATIVE_PROMPT}

Patient: ${ctx.patient.full_name}
DOB: ${ctx.patient.date_of_birth ?? "(unknown)"}
Gender: ${ctx.patient.gender ?? "(unspecified)"}
Allergies: ${ctx.allergies ?? "none recorded"}
Chronic conditions: ${ctx.chronic ?? "none recorded"}

Last ${ctx.consultations.length} consultations (most recent first):
${consultsText || "(none)"}
`;
  const res = await chatSync({ prompt, model: "sonnet" });
  return res.text.trim();
}

async function saveNarrative(
  patientId: string,
  summary: string,
  sourceIds: string[],
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("larinova_patient_narrative").upsert(
    {
      patient_id: patientId,
      summary_md: summary,
      source_consultation_ids: sourceIds,
      model: "claude-sonnet",
      generated_at: new Date().toISOString(),
    },
    { onConflict: "patient_id" },
  );
}
