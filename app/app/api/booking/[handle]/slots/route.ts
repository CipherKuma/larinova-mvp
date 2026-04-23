import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTimeSlots, filterAvailableSlots } from "@/lib/booking/slots";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id, slot_duration_minutes, booking_enabled")
    .eq("booking_handle", handle)
    .single();

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }
  if (!doctor.booking_enabled) {
    return NextResponse.json({ slots: [] });
  }

  // Day of week for the requested date (0=Sun)
  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  const { data: avail } = await supabase
    .from("larinova_doctor_availability")
    .select("start_time, end_time, is_active, break_start, break_end")
    .eq("doctor_id", doctor.id)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!avail || !avail.is_active) {
    return NextResponse.json({ slots: [] });
  }

  const allSlots = generateTimeSlots(
    avail.start_time.substring(0, 5),
    avail.end_time.substring(0, 5),
    doctor.slot_duration_minutes ?? 30,
    avail.break_start,
    avail.break_end,
  );

  const { data: booked } = await supabase
    .from("larinova_appointments")
    .select("start_time")
    .eq("doctor_id", doctor.id)
    .eq("appointment_date", date)
    .in("status", ["confirmed", "completed"]);

  const bookedTimes = (booked ?? []).map((b) => b.start_time);
  const available = filterAvailableSlots(allSlots, bookedTimes);

  return NextResponse.json({ slots: available });
}
