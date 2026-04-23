import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/patients/[id]/follow-ups
 *
 * Returns all wellness follow-up threads for a patient owned by the current
 * doctor, ordered newest first. Each thread includes transcript + outcome
 * classification.
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

  const { data, error } = await supabase
    .from("larinova_follow_up_threads")
    .select(
      "id, tier, status, scheduled_for, transcript, outcome, flagged, exchanges_count, updated_at",
    )
    .eq("doctor_id", doctor.id)
    .eq("patient_id", patientId)
    .order("scheduled_for", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ threads: data ?? [] });
}
