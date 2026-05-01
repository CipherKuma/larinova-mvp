import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  appointmentToScheduleEntry,
  consultationToScheduleEntry,
  sortScheduleEntries,
} from "@/lib/appointments/schedule";

function formatLocalDateYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userResult, doctorResult] = await Promise.all([
      supabase
        .from("larinova_users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("larinova_doctors")
        .select("id")
        .eq("user_id", user.id)
        .single(),
    ]);

    const organizationId = userResult.data?.organization_id;
    const doctor = doctorResult.data;

    const tasksQuery = doctor?.id
      ? supabase
          .from("larinova_tasks")
          .select(
            `
          *,
          patient:larinova_patients!larinova_tasks_patient_id_fkey(
            id,
            full_name,
            patient_code
          ),
          consultation:larinova_consultations!larinova_tasks_consultation_id_fkey(
            id,
            consultation_code
          )
        `,
          )
          .eq("assigned_to", doctor.id)
          .in("status", ["pending", "in_progress"])
          .order("priority", { ascending: false })
          .order("due_date", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [], error: null });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayConsultationsQuery = supabase
      .from("larinova_consultations")
      .select(
        `
        *,
        larinova_patients(
          id,
          full_name,
          patient_code,
          date_of_birth
        )
      `,
      )
      .gte("start_time", today.toISOString())
      .lt("start_time", tomorrow.toISOString())
      .order("start_time", { ascending: true });

    let todayAppointmentsQuery = doctor?.id
      ? supabase
          .from("larinova_appointments")
          .select(
            "id, appointment_date, start_time, end_time, status, booker_name, chief_complaint, prep_brief, patient_id, larinova_patients!patient_id ( id, full_name, patient_code )",
          )
          .eq("doctor_id", doctor.id)
          .eq("appointment_date", formatLocalDateYmd(today))
          .in("status", ["confirmed", "pending"])
          .order("start_time", { ascending: true })
      : Promise.resolve({ data: [], error: null });

    const flaggedQuery = doctor?.id
      ? supabase
          .from("larinova_follow_up_threads")
          .select(
            "id, patient_id, tier, larinova_patients!patient_id ( id, full_name )",
          )
          .eq("doctor_id", doctor.id)
          .eq("flagged", true)
          .order("doctor_notified_at", {
            ascending: false,
            nullsFirst: false,
          })
          .limit(50)
      : Promise.resolve({ data: [], error: null });

    if (organizationId) {
      todayConsultationsQuery = todayConsultationsQuery.eq(
        "organization_id",
        organizationId,
      );
    } else if (doctor?.id) {
      todayConsultationsQuery = todayConsultationsQuery.eq(
        "doctor_id",
        doctor.id,
      );
    } else {
      todayConsultationsQuery = todayConsultationsQuery.limit(0);
      todayAppointmentsQuery = Promise.resolve({ data: [], error: null });
    }

    const [tasksResult, todayResult, appointmentsResult, flaggedResult] =
      await Promise.all([
        tasksQuery,
        todayConsultationsQuery,
        todayAppointmentsQuery,
        flaggedQuery,
      ]);

    if (todayResult.error) throw todayResult.error;
    if (appointmentsResult.error) throw appointmentsResult.error;
    if (flaggedResult.error) throw flaggedResult.error;

    const appointments = appointmentsResult.data || [];
    const nextAppointment = appointments[0] ?? null;

    return NextResponse.json(
      {
        tasks: tasksResult.error ? [] : tasksResult.data || [],
        todayConsultations: sortScheduleEntries([
          ...(todayResult.data || []).map(consultationToScheduleEntry),
          ...appointments.map(appointmentToScheduleEntry),
        ]),
        nextAppointment,
        flaggedThreads: flaggedResult.data || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
