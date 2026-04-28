import type { SupabaseClient } from "@supabase/supabase-js";

export type UpcomingAppointment = {
  id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "video" | "in_person";
  status: "confirmed" | "cancelled" | "completed";
  reason: string;
  chief_complaint: string;
};

export type RecentPrescription = {
  id: string;
  prescription_code: string;
  status: "active" | "completed" | "cancelled";
  follow_up_date: string | null;
  created_at: string;
};

export type HomeData = {
  email: string;
  patientName: string | null;
  upcoming: UpcomingAppointment | null;
  prescription: RecentPrescription | null;
};

/**
 * Fetch everything the home page needs, keyed by the signed-in patient's email.
 * Pure function: takes a Supabase client + email, returns data or nulls.
 * Works against the current schema where `larinova_appointments.booker_email`
 * is the stable link until Team NotifyAgents adds a `patient_id` FK.
 */
export async function loadHomeData(
  supabase: SupabaseClient,
  email: string,
): Promise<HomeData> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: appts } = await supabase
    .from("larinova_appointments")
    .select(
      "id, doctor_id, appointment_date, start_time, end_time, type, status, reason, chief_complaint",
    )
    .eq("booker_email", email)
    .eq("status", "confirmed")
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1);

  const upcoming = (appts?.[0] ?? null) as UpcomingAppointment | null;

  const { data: patient } = await supabase
    .from("larinova_patients")
    .select("id, full_name")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  let prescription: RecentPrescription | null = null;
  if (patient?.id) {
    const { data: rx } = await supabase
      .from("larinova_prescriptions")
      .select("id, prescription_code, status, follow_up_date, created_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(1);
    prescription = (rx?.[0] ?? null) as RecentPrescription | null;
  }

  return {
    email,
    patientName:
      (patient as { full_name?: string | null } | null)?.full_name ?? null,
    upcoming,
    prescription,
  };
}

export function formatApptTime(
  a: Pick<UpcomingAppointment, "appointment_date" | "start_time">,
): string {
  // "2026-05-04" + "14:30:00" → "Mon, 4 May, 2:30 PM"
  try {
    const dt = new Date(`${a.appointment_date}T${a.start_time}`);
    if (Number.isNaN(dt.getTime())) {
      return `${a.appointment_date} ${String(a.start_time).slice(0, 5)}`;
    }
    return dt.toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return `${a.appointment_date} ${a.start_time.slice(0, 5)}`;
  }
}
