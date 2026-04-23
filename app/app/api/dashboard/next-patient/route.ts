import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dashboard/next-patient
 *
 * Returns the next scheduled appointment today for the logged-in doctor,
 * along with patient details for the queue-first home card.
 */
export async function GET() {
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

  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("larinova_appointments")
    .select(
      "id, appointment_date, start_time, end_time, status, booker_name, prep_brief, patient_id, larinova_patients!patient_id ( id, full_name, patient_code )",
    )
    .eq("doctor_id", doctor.id)
    .eq("appointment_date", today)
    .in("status", ["confirmed", "pending"])
    .order("start_time", { ascending: true })
    .limit(1);

  const next = data?.[0] ?? null;

  return NextResponse.json({ next });
}
