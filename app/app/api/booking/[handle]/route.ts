import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const supabase = createAdminClient();

  const { data: doctor, error } = await supabase
    .from("larinova_doctors")
    .select(
      "id, full_name, specialization, clinic_name, clinic_address, profile_image_url, booking_enabled, slot_duration_minutes, video_call_link, region",
    )
    .eq("booking_handle", handle)
    .single();

  if (error || !doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const { data: availability } = await supabase
    .from("larinova_doctor_availability")
    .select(
      "day_of_week, start_time, end_time, is_active, break_start, break_end",
    )
    .eq("doctor_id", doctor.id)
    .order("day_of_week");

  return NextResponse.json({ doctor, availability: availability ?? [] });
}
