import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch consultation with patient and doctor info
    const { data: consultation, error } = await supabase
      .from("larinova_consultations")
      .select(
        `
        *,
        patient:larinova_patients!larinova_consultations_patient_id_fkey(
          id,
          full_name,
          email,
          phone,
          date_of_birth,
          gender
        ),
        doctor:larinova_doctors!larinova_consultations_doctor_id_fkey(
          id,
          full_name,
          email,
          specialization
        )
      `,
      )
      .eq("id", consultationId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch consultation" },
        { status: 500 },
      );
    }

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ consultation });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
