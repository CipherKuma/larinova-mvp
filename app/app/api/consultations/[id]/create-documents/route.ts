import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

    // Get the request body with optional summary, soapNote, medicalCodes
    const body = await req.json().catch(() => ({}));
    const { summary, soapNote, medicalCodes } = body;

    // Fetch consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from("larinova_consultations")
      .select(
        `
        *,
        patient:larinova_patients(id, full_name, patient_code),
        doctor:larinova_doctors(id, full_name)
      `,
      )
      .eq("id", consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 },
      );
    }

    const patientName = consultation.patient?.full_name || "Patient";
    const dateStr = new Date(consultation.start_time).toLocaleDateString();

    // 1. Fetch transcripts for this consultation
    const { data: transcriptRows } = await supabase
      .from("larinova_transcripts")
      .select("text, timestamp_start")
      .eq("consultation_id", consultationId)
      .order("timestamp_start", { ascending: true });

    const transcriptContent = (transcriptRows || [])
      .map((t) => {
        const mins = Math.floor((t.timestamp_start || 0) / 60);
        const secs = Math.floor((t.timestamp_start || 0) % 60);
        const ts = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        return `${ts} | ${t.text}`;
      })
      .join("\n");

    // 2. Prepare all 4 documents
    const soapContent = soapNote || consultation.soap_note || "";
    const summaryContent = summary || consultation.ai_summary || "";
    const codesContent = medicalCodes || consultation.medical_codes;
    const codesString = codesContent ? JSON.stringify(codesContent) : "";

    const docs = [
      {
        document_type: "transcript",
        title: `Transcript - ${patientName} - ${dateStr}`,
        content: transcriptContent,
      },
      {
        document_type: "consultation_summary",
        title: `AI Summary - ${patientName} - ${dateStr}`,
        content: summaryContent,
      },
      {
        document_type: "soap_note",
        title: `SOAP Note - ${patientName} - ${dateStr}`,
        content: soapContent,
      },
      {
        document_type: "medical_codes",
        title: `Medical Codes - ${patientName} - ${dateStr}`,
        content: codesString,
      },
    ];

    // 3. Save all 4 with Promise.allSettled
    const results = await Promise.allSettled(
      docs.map((doc) =>
        supabase
          .from("larinova_documents")
          .insert({
            doctor_id: consultation.doctor_id,
            patient_id: consultation.patient_id,
            consultation_id: consultationId,
            document_type: doc.document_type,
            title: doc.title,
            content: doc.content,
            status: "finalized",
          })
          .select("id")
          .single(),
      ),
    );

    const createdDocuments: string[] = [];
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.data) {
        createdDocuments.push(result.value.data.id);
      }
    });

    return NextResponse.json({
      success: true,
      documentsCreated: createdDocuments.length,
      documentIds: createdDocuments,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
