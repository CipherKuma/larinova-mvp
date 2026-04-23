import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info
    const { data: doctor, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );
    }

    // Get request body (optional diagnosis, summary, chief_complaint)
    const body = await request.json().catch(() => ({}));
    const { diagnosis, summary, chief_complaint } = body;

    // Verify consultation belongs to this doctor
    const { data: consultation, error: consultationError } = await supabase
      .from("larinova_consultations")
      .select("id, doctor_id, status")
      .eq("id", id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 },
      );
    }

    if (consultation.doctor_id !== doctor.id) {
      return NextResponse.json(
        { error: "You do not have permission to end this consultation" },
        { status: 403 },
      );
    }

    if (consultation.status === "completed") {
      return NextResponse.json(
        { error: "Consultation is already completed" },
        { status: 400 },
      );
    }

    // Update consultation to completed
    const { data: updatedConsultation, error: updateError } = await supabase
      .from("larinova_consultations")
      .update({
        end_time: new Date().toISOString(),
        status: "completed",
        diagnosis: diagnosis || null,
        summary: summary || null,
        chief_complaint: chief_complaint || null,
      })
      .eq("id", id)
      .select("id, consultation_code, duration_minutes, status, end_time")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to end consultation" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      consultation: updatedConsultation,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
