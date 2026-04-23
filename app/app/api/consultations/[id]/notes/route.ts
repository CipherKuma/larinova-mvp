import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { chief_complaint, notes } = await req.json();
    const { id: consultationId } = await params;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the consultation belongs to this doctor
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );
    }

    const { data: consultation } = await supabase
      .from("larinova_consultations")
      .select("id")
      .eq("id", consultationId)
      .eq("doctor_id", doctor.id)
      .single();

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update consultation with notes
    const { error: updateError } = await supabase
      .from("larinova_consultations")
      .update({
        chief_complaint: chief_complaint || null,
        summary: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save notes" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notes saved successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
