/**
 * simulate-intake.ts — dry-run the Pre-consult Intake AI against a fake
 * appointment. Uses SIMULATE_NOTIFY=1 so no real provider calls go out.
 *
 * Usage (requires a reachable Claude Service + Supabase):
 *   cd app && SIMULATE_NOTIFY=1 pnpm tsx scripts/simulate-intake.ts
 *
 * Dependencies: dotenv loads .env.local. The script:
 *   1. Seeds (or reuses) a doctor + patient + appointment + intake submission.
 *   2. Invokes the intake agent's internal helpers directly (no Inngest
 *      dev server required) — evaluate + generate prep brief.
 *   3. Prints every intermediate state to stdout.
 *   4. Exits 0 on success, 1 on any failure.
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
process.env.SIMULATE_NOTIFY = process.env.SIMULATE_NOTIFY ?? "1";

import { createAdminClient } from "@/lib/supabase/admin";
import { chatSync, extractJson } from "@/lib/ai/claude";
import { notify } from "@/lib/notify";

async function main(): Promise<void> {
  const supabase = createAdminClient();
  const marker = `sim-intake-${Date.now()}`;
  console.log(`\n=== simulate-intake ${marker} ===\n`);

  // 1. Seed a doctor
  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .insert({
      email: `${marker}-doc@example.test`,
      full_name: "Priya Kapoor",
      specialization: "General Physician",
    })
    .select("id, full_name, email")
    .single();
  mustExist(doctor, "doctor seed");
  console.log(`doctor: ${doctor!.id} (${doctor!.full_name})`);

  // 2. Seed a patient
  const { data: patient } = await supabase
    .from("larinova_patients")
    .insert({
      email: `${marker}-pat@example.test`,
      full_name: "Raj Sharma",
      phone: "+919812345678",
      created_by_doctor_id: doctor!.id,
    })
    .select("id, full_name, email, phone")
    .single();
  mustExist(patient, "patient seed");
  console.log(`patient: ${patient!.id} (${patient!.full_name})`);

  // 3. Seed an appointment
  const today = new Date().toISOString().slice(0, 10);
  const { data: appointment } = await supabase
    .from("larinova_appointments")
    .insert({
      doctor_id: doctor!.id,
      patient_id: patient!.id,
      appointment_date: today,
      start_time: "10:00",
      end_time: "10:30",
      type: "in_person",
      status: "confirmed",
      booker_name: patient!.full_name,
      booker_email: patient!.email,
      booker_phone: patient!.phone ?? "+919812345678",
      booker_age: 34,
      booker_gender: "male",
      reason: "Persistent cough",
      chief_complaint: "Dry cough for 5 days, mild fever",
    })
    .select("id, chief_complaint, appointment_date, start_time, locale")
    .single();
  mustExist(appointment, "appointment seed");
  console.log(`appointment: ${appointment!.id}`);

  // 4. Seed an intake submission
  const { data: submission } = await supabase
    .from("larinova_intake_submissions")
    .insert({
      appointment_id: appointment!.id,
      patient_id: patient!.id,
      form_data: {
        duration_days: 5,
        fever: true,
        fever_range: "99-101F",
        cough_type: "dry",
        meds_tried: ["paracetamol"],
        other_symptoms: ["tiredness"],
      },
      locale: "in",
    })
    .select("id, form_data, ai_followup_rounds")
    .single();
  mustExist(submission, "intake submission seed");

  await supabase
    .from("larinova_appointments")
    .update({ intake_submission_id: submission!.id })
    .eq("id", appointment!.id);

  // 5. Run the intake evaluation (simplified version of the agent steps)
  console.log(`\n--- evaluate ---`);
  const evalRes = await chatSync({
    prompt: `You are a clinical intake assistant. Review the intake and say
whether the doctor has enough to run a good first consult. Return ONLY JSON:
{ ready: boolean, questions: string[], documents_requested: string[], summary: string }

Chief complaint: ${appointment!.chief_complaint}
Intake: ${JSON.stringify(submission!.form_data, null, 2)}`,
    model: "sonnet",
  });
  const evaluation = extractJson<{
    ready: boolean;
    questions: string[];
    documents_requested: string[];
    summary: string;
  }>(evalRes.text);
  console.log(JSON.stringify(evaluation, null, 2));

  // 6. If not ready, exercise the notify call (simulated)
  if (!evaluation.ready && evaluation.questions.length > 0) {
    console.log(`\n--- send intake_info_request (simulated) ---`);
    const res = await notify(
      "whatsapp",
      "intake_info_request",
      {
        patientName: patient!.full_name,
        doctorName: doctor!.full_name,
        questions: evaluation.questions.slice(0, 3),
        documentsRequested: evaluation.documents_requested,
      },
      {
        patientId: patient!.id,
        phone: patient!.phone ?? undefined,
        whatsapp: patient!.phone ?? undefined,
        name: patient!.full_name,
      },
      { relatedEntityType: "appointment", relatedEntityId: appointment!.id },
    );
    console.log(`notify result: ${JSON.stringify(res)}`);
  }

  // 7. Generate prep brief
  console.log(`\n--- generate prep brief ---`);
  const prepRes = await chatSync({
    prompt: `Write the Prep Brief the doctor reads before this consult.
Return ONLY JSON:
{ summary: string, red_flags: string[], suggested_questions: string[], medications_to_review: string[] }

Patient: ${patient!.full_name}
Chief complaint: ${appointment!.chief_complaint}
Intake: ${JSON.stringify(submission!.form_data, null, 2)}
Eval: ${JSON.stringify(evaluation, null, 2)}`,
    model: "sonnet",
  });
  const prep = extractJson(prepRes.text);
  console.log(JSON.stringify(prep, null, 2));

  // 8. Save prep brief
  await supabase
    .from("larinova_appointments")
    .update({ prep_brief: prep })
    .eq("id", appointment!.id);

  console.log(`\n--- cleanup ---`);
  // Clean up seeds so the script is idempotent across re-runs.
  await supabase
    .from("larinova_intake_submissions")
    .delete()
    .eq("id", submission!.id);
  await supabase
    .from("larinova_appointments")
    .delete()
    .eq("id", appointment!.id);
  await supabase.from("larinova_patients").delete().eq("id", patient!.id);
  await supabase.from("larinova_doctors").delete().eq("id", doctor!.id);
  console.log(`ok`);
}

function mustExist<T>(value: T | null | undefined, label: string): void {
  if (!value) {
    console.error(`[fatal] ${label} missing`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
