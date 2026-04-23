import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/follow-ups/flagged
 *
 * Lists follow-up threads that the Wellness agent flagged for the logged-in
 * doctor. Used by the home-screen alert banner + the flagged list page.
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

  const { data, error } = await supabase
    .from("larinova_follow_up_threads")
    .select(
      "id, patient_id, tier, scheduled_for, outcome, flagged, doctor_notified_at, updated_at, larinova_patients!patient_id ( id, full_name )",
    )
    .eq("doctor_id", doctor.id)
    .eq("flagged", true)
    .order("doctor_notified_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ threads: data ?? [] });
}
