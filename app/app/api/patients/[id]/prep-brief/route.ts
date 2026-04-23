import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/patients/[id]/prep-brief
 *
 * Returns the most recent prep_brief from an upcoming or same-day appointment
 * for this patient that the caller (doctor) owns. Consultations aren't yet
 * directly linked to appointments in schema, so we match by (doctor_id,
 * patient_id) and prefer the closest appointment whose prep_brief is set.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: patientId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: appointment } = await supabase
    .from("larinova_appointments")
    .select("id, prep_brief, appointment_date, start_time")
    .eq("doctor_id", doctor.id)
    .eq("patient_id", patientId)
    .not("prep_brief", "is", null)
    .gte("appointment_date", sevenDaysAgo)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ prepBrief: null });
  }

  return NextResponse.json({
    prepBrief: appointment.prep_brief,
    appointmentId: appointment.id,
  });
}
