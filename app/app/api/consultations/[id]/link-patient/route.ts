import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: consultationId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await request.json();
    const { patient_name } = body;

    if (!patient_name) {
      return NextResponse.json(
        { error: "patient_name is required" },
        { status: 400 },
      );
    }

    // Create a new patient record with just the name
    const placeholderEmail = `patient-${consultationId.slice(0, 8)}@unknown.larinova`;
    const { data: newPatient, error: patientError } = await supabase
      .from("larinova_patients")
      .insert({
        full_name: patient_name.trim(),
        email: placeholderEmail,
        created_by_doctor_id: doctor.id,
      })
      .select("id, patient_code")
      .single();

    if (patientError || !newPatient) {
      return NextResponse.json(
        { error: "Failed to create patient", details: patientError?.message },
        { status: 500 },
      );
    }

    // Link the patient to the consultation
    const { error: updateError } = await supabase
      .from("larinova_consultations")
      .update({ patient_id: newPatient.id })
      .eq("id", consultationId)
      .eq("doctor_id", doctor.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to link patient to consultation" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      patient_id: newPatient.id,
      patient_code: newPatient.patient_code,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
