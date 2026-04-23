import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor profile
    const { data: doctor, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Fetch all stats in parallel
    const [
      totalPatientsResult,
      todayConsultationsResult,
      weekConsultationsResult,
      recentActivityResult,
    ] = await Promise.all([
      // Total patients count
      supabase
        .from("larinova_patients")
        .select("id", { count: "exact", head: true }),

      // Today's consultations
      supabase
        .from("larinova_consultations")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctor.id)
        .gte("start_time", new Date().toISOString().split("T")[0]),

      // This week's consultations
      supabase
        .from("larinova_consultations")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctor.id)
        .gte("start_time", getStartOfWeek()),

      // Recent consultations
      supabase
        .from("larinova_consultations")
        .select(
          `
          id,
          start_time,
          status,
          larinova_patients (
            full_name,
            patient_code
          )
        `,
        )
        .eq("doctor_id", doctor.id)
        .order("start_time", { ascending: false })
        .limit(5),
    ]);

    return NextResponse.json({
      totalPatients: totalPatientsResult.count || 0,
      todayConsultations: todayConsultationsResult.count || 0,
      weekConsultations: weekConsultationsResult.count || 0,
      recentActivity: recentActivityResult.data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getStartOfWeek(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString();
}
