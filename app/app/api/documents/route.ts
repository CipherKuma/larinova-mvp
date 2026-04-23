import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all documents for the current doctor
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const patientId = searchParams.get("patient_id");

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from("larinova_documents")
      .select(
        `
        *,
        patient:larinova_patients(id, full_name, patient_code, date_of_birth, gender),
        consultation:larinova_consultations(id, consultation_code)
      `,
      )
      .eq("doctor_id", doctor.id)
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("document_type", type);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data: documents, error } = await query.limit(100);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 },
      );
    }

    // Group documents by type for folder structure
    const documentsByType: Record<string, typeof documents> = {};
    documents?.forEach((doc) => {
      const docType = doc.document_type || "general";
      if (!documentsByType[docType]) {
        documentsByType[docType] = [];
      }
      documentsByType[docType].push(doc);
    });

    return NextResponse.json({
      documents,
      documentsByType,
      total: documents?.length || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
