import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPatientFromAuthHeader } from "@/lib/auth/patient";
import { jsonWithCors, preflight } from "@/lib/cors";
import { enqueueJob } from "@/lib/jobs/enqueue";

/**
 * POST /api/intake-submissions
 *
 * Called from patient.larinova.com when a patient submits the intake form
 * attached to one of their appointments. Scoped so a patient can only write
 * submissions against appointments they own (match by booker_email OR the
 * linked larinova_patients row by JWT email).
 *
 * Side effects:
 *   - Insert larinova_intake_submissions row
 *   - Update larinova_appointments.intake_submission_id
 *   - Emit intake.submitted Inngest event so the Intake AI kicks off
 */

const bodySchema = z.object({
  appointmentId: z.string().uuid(),
  formData: z.record(z.string(), z.unknown()),
  templateId: z.string().uuid().optional(),
  locale: z.enum(["in", "id"]).optional(),
});

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const patient = await getPatientFromAuthHeader(req);
  if (!patient) {
    return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    return jsonWithCors(
      req,
      { error: "invalid_body", detail: String(err) },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("larinova_appointments")
    .select("id, booker_email, patient_id, locale")
    .eq("id", parsed.appointmentId)
    .maybeSingle();

  if (!appointment) {
    return jsonWithCors(req, { error: "not_found" }, { status: 404 });
  }

  const owned =
    appointment.booker_email?.toLowerCase() === patient.email.toLowerCase() ||
    (await patientOwnsById(appointment.patient_id, patient.email));
  if (!owned) {
    return jsonWithCors(req, { error: "forbidden" }, { status: 403 });
  }

  // Resolve-or-create the larinova_patients row so future agent runs can
  // key off patient_id. Match by email (case-insensitive); if no row,
  // create a minimal one here.
  const patientId = await resolvePatientId(
    patient.email,
    appointment.patient_id,
  );
  if (!patientId) {
    return jsonWithCors(
      req,
      { error: "patient_resolve_failed" },
      { status: 500 },
    );
  }

  const { data: submission, error: insertErr } = await supabase
    .from("larinova_intake_submissions")
    .insert({
      appointment_id: parsed.appointmentId,
      patient_id: patientId,
      template_id: parsed.templateId ?? null,
      form_data: parsed.formData,
      locale: parsed.locale ?? appointment.locale ?? "in",
    })
    .select("id")
    .single();

  if (insertErr || !submission) {
    return jsonWithCors(
      req,
      { error: "insert_failed", detail: insertErr?.message },
      { status: 500 },
    );
  }

  await supabase
    .from("larinova_appointments")
    .update({
      intake_submission_id: submission.id,
      intake_template_id: parsed.templateId ?? null,
      patient_id: patientId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.appointmentId);

  await enqueueJob("intake.submitted", {
    appointmentId: parsed.appointmentId,
  });

  return jsonWithCors(req, { submissionId: submission.id, patientId });
}

async function patientOwnsById(
  patientId: string | null,
  email: string,
): Promise<boolean> {
  if (!patientId) return false;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("larinova_patients")
    .select("id")
    .eq("id", patientId)
    .ilike("email", email)
    .maybeSingle();
  return !!data;
}

async function resolvePatientId(
  email: string,
  existing: string | null,
): Promise<string | null> {
  if (existing) return existing;
  const supabase = createAdminClient();
  const { data: match } = await supabase
    .from("larinova_patients")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (match) return match.id as string;

  // Minimal patient row — full profile gets completed during the first
  // in-person consult.
  const { data: inserted } = await supabase
    .from("larinova_patients")
    .insert({
      email,
      full_name: email.split("@")[0],
    })
    .select("id")
    .single();
  return (inserted?.id as string) ?? null;
}
