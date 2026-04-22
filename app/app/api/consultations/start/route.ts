import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkConsultationLimit } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doctor, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );
    }

    const limit = await checkConsultationLimit(doctor.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "free_tier_exhausted",
          limit: limit.limit,
          used: limit.used,
        },
        { status: 402 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      patient_id,
      chief_complaint,
      // New patient fields
      patient_name,
      patient_gender,
      patient_dob,
      patient_email,
      patient_phone,
      patient_blood_group,
      patient_address,
    } = body;

    let patient: {
      id: string;
      full_name: string;
      date_of_birth: string | null;
      gender: string | null;
      phone: string | null;
      email: string | null;
    } | null = null;

    if (patient_id) {
      // Existing patient
      const { data, error: patientError } = await supabase
        .from("larinova_patients")
        .select("id, full_name, date_of_birth, gender, phone, email")
        .eq("id", patient_id)
        .single();

      if (patientError || !data) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 },
        );
      }
      patient = data;
    } else if (patient_name) {
      // New patient — create inline
      const placeholderEmail =
        patient_email?.trim() || `patient-${Date.now()}@unknown.larinova`;

      const { data: newPatient, error: createError } = await supabase
        .from("larinova_patients")
        .insert({
          full_name: patient_name.trim(),
          email: placeholderEmail,
          phone: patient_phone?.trim() || null,
          gender: patient_gender || null,
          date_of_birth: patient_dob || null,
          blood_group: patient_blood_group || null,
          address: patient_address?.trim() || null,
          created_by_doctor_id: doctor.id,
        })
        .select("id, full_name, date_of_birth, gender, phone, email")
        .single();

      if (createError || !newPatient) {
        return NextResponse.json(
          {
            error: "Failed to create patient",
            details: createError?.message,
          },
          { status: 500 },
        );
      }
      patient = newPatient;
    }

    const { data: consultation, error: consultationError } = await supabase
      .from("larinova_consultations")
      .insert({
        patient_id: patient?.id ?? null,
        doctor_id: doctor.id,
        start_time: new Date().toISOString(),
        status: "in_progress",
        chief_complaint: chief_complaint || null,
      })
      .select("id, consultation_code, start_time, status")
      .single();

    if (consultationError) {
      return NextResponse.json(
        {
          error: "Failed to create consultation",
          details: consultationError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      consultation: {
        ...consultation,
        patient: patient
          ? {
              id: patient.id,
              full_name: patient.full_name,
              date_of_birth: patient.date_of_birth,
              gender: patient.gender,
              phone_number: patient.phone,
            }
          : null,
        doctor: {
          id: doctor.id,
          full_name: doctor.full_name,
        },
      },
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
