import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    }

    const [tasksResult, todayResult] = await Promise.all([
      tasksQuery,
      todayConsultationsQuery,
    ]);

    if (todayResult.error) throw todayResult.error;

    return NextResponse.json({
      tasks: tasksResult.error ? [] : tasksResult.data || [],
      todayConsultations: todayResult.data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
