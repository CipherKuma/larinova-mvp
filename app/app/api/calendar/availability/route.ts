import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHandle, handleWithSuffix } from "@/lib/booking/handle";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select(
      "id, full_name, booking_handle, booking_enabled, slot_duration_minutes, video_call_link, region",
    )
    .eq("user_id", user.id)
    .single();
  if (!doctor)
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  // Auto-generate handle if missing
  if (!doctor.booking_handle) {
    const admin = createAdminClient();
    let handle = generateHandle(doctor.full_name);
    const { data: existing } = await admin
      .from("larinova_doctors")
      .select("id")
      .eq("booking_handle", handle)
      .neq("id", doctor.id)
      .maybeSingle();
    if (existing) handle = handleWithSuffix(handle);

    await admin
      .from("larinova_doctors")
      .update({ booking_handle: handle })
      .eq("id", doctor.id);
    doctor.booking_handle = handle;
  }

  const { data: availability } = await supabase
    .from("larinova_doctor_availability")
    .select("*")
    .eq("doctor_id", doctor.id)
    .order("day_of_week");

  // Seed default Mon-Fri 9-5 if no rows
  if (!availability || availability.length === 0) {
    const admin = createAdminClient();
    const defaults = [1, 2, 3, 4, 5].map((day) => ({
      doctor_id: doctor.id,
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      is_active: true,
    }));
    await admin.from("larinova_doctor_availability").insert(defaults);
    const { data: seeded } = await supabase
      .from("larinova_doctor_availability")
      .select("*")
      .eq("doctor_id", doctor.id)
      .order("day_of_week");
    return NextResponse.json({ doctor, availability: seeded ?? [] });
  }

  return NextResponse.json({ doctor, availability });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor)
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const body = (await req.json()) as {
    availability: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
      break_start?: string | null;
      break_end?: string | null;
    }>;
    slot_duration_minutes?: number;
    video_call_link?: string;
    booking_enabled?: boolean;
  };

  const admin = createAdminClient();

  const rows = body.availability.map((a) => ({
    doctor_id: doctor.id,
    day_of_week: a.day_of_week,
    start_time: a.start_time,
    end_time: a.end_time,
    is_active: a.is_active,
    break_start: a.break_start ?? null,
    break_end: a.break_end ?? null,
  }));

  const { error: availError } = await admin
    .from("larinova_doctor_availability")
    .upsert(rows, { onConflict: "doctor_id,day_of_week" });

  if (availError)
    return NextResponse.json({ error: availError.message }, { status: 500 });

  const updates: Record<string, unknown> = {};
  if (body.slot_duration_minutes !== undefined)
    updates.slot_duration_minutes = body.slot_duration_minutes;
  if (body.video_call_link !== undefined)
    updates.video_call_link = body.video_call_link;
  if (body.booking_enabled !== undefined)
    updates.booking_enabled = body.booking_enabled;

  if (Object.keys(updates).length > 0) {
    await admin.from("larinova_doctors").update(updates).eq("id", doctor.id);
  }

  return NextResponse.json({ success: true });
}
