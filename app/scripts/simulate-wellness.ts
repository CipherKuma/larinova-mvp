/**
 * simulate-wellness.ts — dry-run the Wellness Follow-up Agent. Walks one
 * full conversational loop: opening → patient probe → escalation.
 *
 *   cd app && SIMULATE_NOTIFY=1 pnpm tsx scripts/simulate-wellness.ts
 *
 * Prints every outbound WhatsApp to stdout via SIMULATE_NOTIFY=1. No real
 * Gupshup traffic. Idempotent — cleans up its own seed data.
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
process.env.SIMULATE_NOTIFY = process.env.SIMULATE_NOTIFY ?? "1";

import { createAdminClient } from "@/lib/supabase/admin";
import { chatSync, extractJson } from "@/lib/ai/claude";
import { notify } from "@/lib/notify";

interface ClassifyDecision {
  action: "probe" | "escalate" | "close";
  body: string;
  classification: "improving" | "unchanged" | "flagged";
}

async function main(): Promise<void> {
  const supabase = createAdminClient();
  const marker = `sim-wellness-${Date.now()}`;
  console.log(`\n=== simulate-wellness ${marker} ===\n`);

  // Seed minimal fixtures
  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .insert({
      email: `${marker}-doc@example.test`,
      full_name: "Priya Kapoor",
      specialization: "General Physician",
    })
    .select("id, full_name, email")
    .single();
  must(doctor, "doctor");

  const { data: patient } = await supabase
    .from("larinova_patients")
    .insert({
      email: `${marker}-pat@example.test`,
      full_name: "Raj Sharma",
      phone: "+919812345678",
      created_by_doctor_id: doctor!.id,
    })
    .select("id, full_name, phone")
    .single();
  must(patient, "patient");

  const { data: consultation } = await supabase
    .from("larinova_consultations")
    .insert({
      patient_id: patient!.id,
      doctor_id: doctor!.id,
      chief_complaint: "Dry cough + fever",
      diagnosis: "Viral fever",
      summary: "Rest, fluids, paracetamol 500mg q6h PRN.",
      status: "completed",
    })
    .select("id, chief_complaint")
    .single();
  must(consultation, "consultation");

  const scheduledFor = new Date(Date.now() + 1000).toISOString();
  const { data: thread } = await supabase
    .from("larinova_follow_up_threads")
    .insert({
      patient_id: patient!.id,
      doctor_id: doctor!.id,
      consultation_id: consultation!.id,
      tier: "day-1",
      scheduled_for: scheduledFor,
      status: "scheduled",
    })
    .select("id, tier")
    .single();
  must(thread, "thread");
  console.log(`thread: ${thread!.id}`);

  // 1. Opening
  console.log(`\n--- opening message ---`);
  const openRes = await chatSync({
    prompt: `Write ONE short warm WhatsApp message (<280 chars) to check on a
patient after their consult. Patient: ${patient!.full_name}. Doctor: Dr. ${doctor!.full_name}.
Chief complaint: ${consultation!.chief_complaint}. Tier: day-1.
Return ONLY the message text.`,
    model: "sonnet",
  });
  const opening = openRes.text.trim().replace(/^[\s"']+|[\s"']+$/g, "");
  await notify(
    "whatsapp",
    "followup_prompt_day1",
    {
      patientName: patient!.full_name,
      doctorName: doctor!.full_name,
      chiefComplaint: consultation!.chief_complaint ?? undefined,
      promptBody: opening,
    },
    {
      patientId: patient!.id,
      phone: patient!.phone ?? undefined,
      whatsapp: patient!.phone ?? undefined,
      name: patient!.full_name,
    },
    { relatedEntityType: "follow_up_thread", relatedEntityId: thread!.id },
  );

  const transcript = [
    { role: "agent", body: opening, at: new Date().toISOString() },
  ];

  // 2. Scripted patient reply — worsening so we exercise the escalate path.
  const patientReply =
    "actually feeling a bit worse, chest feels tight and breathing isn't easy";
  transcript.push({
    role: "patient",
    body: patientReply,
    at: new Date().toISOString(),
  });
  console.log(`\n--- patient reply ---\n${patientReply}`);

  // 3. Classify reply
  console.log(`\n--- classify ---`);
  const classifyRes = await chatSync({
    prompt: `You are a wellness follow-up agent. Decide the next action.
Return ONLY JSON: { action: "probe" | "escalate" | "close", body: string, classification: "improving" | "unchanged" | "flagged" }

Transcript:
${transcript.map((m) => `${m.role.toUpperCase()}: ${m.body}`).join("\n")}

Rules:
- chest tightness + breathing trouble = escalate, classification=flagged.
- Keep body empathetic, under 300 chars. Never diagnose.`,
    model: "sonnet",
  });
  const decision = extractJson<ClassifyDecision>(classifyRes.text);
  console.log(JSON.stringify(decision, null, 2));

  // 4. Apply decision — we expect escalate
  if (decision.action === "escalate") {
    await notify(
      "email",
      "followup_flagged_doctor",
      {
        doctorName: doctor!.full_name,
        patientName: patient!.full_name,
        tier: "day-1",
        reason: `classification=${decision.classification}`,
        transcriptSnippet: transcript
          .map((m) => `${m.role}: ${m.body}`)
          .join("\n"),
      },
      { doctorId: doctor!.id, email: doctor!.email ?? undefined },
      { relatedEntityType: "follow_up_thread", relatedEntityId: thread!.id },
    );
    await supabase
      .from("larinova_follow_up_threads")
      .update({
        flagged: true,
        doctor_notified_at: new Date().toISOString(),
        outcome: "flagged",
        status: "active",
      })
      .eq("id", thread!.id);
  }

  // 5. Cleanup
  console.log(`\n--- cleanup ---`);
  await supabase
    .from("larinova_follow_up_threads")
    .delete()
    .eq("id", thread!.id);
  await supabase
    .from("larinova_consultations")
    .delete()
    .eq("id", consultation!.id);
  await supabase.from("larinova_patients").delete().eq("id", patient!.id);
  await supabase.from("larinova_doctors").delete().eq("id", doctor!.id);
  console.log(`ok`);
}

function must<T>(v: T | null | undefined, label: string): void {
  if (!v) {
    console.error(`[fatal] ${label} missing`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
