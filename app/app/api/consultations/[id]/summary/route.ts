import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage, recordAIUsage } from "@/lib/subscription";
import { chatSync } from "@/lib/ai/sarvam";
import { CLINICAL_TRANSCRIPT_BOUNDARY_RULES } from "@/lib/consultation/transcript-safety";

export const maxDuration = 60;

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

    // Check AI usage limits
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id, locale")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const usage = await checkAIUsage(doctor.id, "summary");
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error:
            "Free trial limit reached for summary generation. Upgrade to Pro for unlimited access.",
          usage,
          upgrade_required: true,
        },
        { status: 403 },
      );
    }

    // Get all transcripts for this consultation (should be diarized by now)
    const { data: transcripts, error: transcriptsError } = await supabase
      .from("larinova_transcripts")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("timestamp_start", { ascending: true });

    if (transcriptsError) {
      return NextResponse.json(
        { error: "Failed to fetch transcripts" },
        { status: 500 },
      );
    }

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json(
        { error: "No transcripts found for this consultation" },
        { status: 400 },
      );
    }

    // Get consultation details for context
    const { data: consultation } = await supabase
      .from("larinova_consultations")
      .select(
        `
        *,
        patient:larinova_patients(full_name, date_of_birth, gender, blood_group),
        doctor:larinova_doctors(full_name, specialization)
      `,
      )
      .eq("id", consultationId)
      .single();

    // Combine all transcripts into a diarized conversation text
    const conversationText = transcripts
      .map((t) => `${t.speaker?.toUpperCase() || "UNKNOWN"}: ${t.text}`)
      .join("\n\n");

    // Calculate consultation duration
    const startTime = transcripts[0]?.timestamp_start || 0;
    const endTime = transcripts[transcripts.length - 1]?.timestamp_end || 0;
    const durationMinutes = Math.ceil((endTime - startTime) / 60);

    const locale = (doctor.locale as string) ?? "in";
    const isId = locale === "id";
    const lang = isId ? "Bahasa Indonesia" : "English";

    const sections = isId
      ? [
          "1. **Keluhan Utama**: Apa alasan utama pasien datang untuk konsultasi ini?",
          "2. **Gejala Utama yang Dibahas**: Daftar gejala atau keluhan utama yang disebutkan pasien.",
          "3. **Riwayat Medis yang Disebutkan**: Riwayat medis yang relevan, obat-obatan, atau alergi yang dibahas.",
          "4. **Penilaian Dokter**: Observasi kunci, penilaian awal, atau diagnosis yang disarankan oleh dokter.",
          "5. **Tindakan yang Direkomendasikan**: Pemeriksaan yang diminta, pengobatan yang disarankan, obat-obatan yang dibahas, atau instruksi tindak lanjut.",
          "6. **Catatan Penting**: Informasi kritis lainnya dari konsultasi yang harus disorot.",
        ]
      : [
          "1. **Chief Complaint**: What is the main reason the patient came for this consultation?",
          "2. **Key Symptoms Discussed**: List the main symptoms or concerns mentioned by the patient.",
          "3. **Medical History Mentioned**: Any relevant past medical history, medications, or allergies discussed.",
          "4. **Doctor's Assessment**: Key observations, preliminary assessments, or diagnoses suggested by the doctor.",
          "5. **Recommended Actions**: Any tests ordered, treatments suggested, medications discussed, or follow-up instructions.",
          "6. **Important Notes**: Any other critical information from the consultation that should be highlighted.",
        ];

    const systemPrompt = `You are a medical documentation assistant for the Larinova healthcare platform. Generate DRAFT consultation summaries for physician review. Write entirely in ${lang}. Structure the summary with these sections:\n\n${sections.join("\n\n")}\n\nGuidelines: be concise (300-500 words), use bullet points, only include information from the transcript, do not fabricate information, use professional medical terminology.\n\n${CLINICAL_TRANSCRIPT_BOUNDARY_RULES}`;

    const p = consultation?.patient as any;
    const patientLines = [
      `Patient: ${p?.full_name || "Unknown"}`,
      p?.date_of_birth ? `DOB: ${p.date_of_birth}` : null,
      p?.gender ? `Gender: ${p.gender}` : null,
      p?.blood_group ? `Blood Group: ${p.blood_group}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `${patientLines}\nDoctor: ${consultation?.doctor?.full_name || "Unknown"} (${(consultation?.doctor as any)?.specialization || "General"})\nDuration: ~${durationMinutes} min\n\nConversation:\n"""\n${conversationText}\n"""\n\nGenerate the summary now.`;

    let summary = "";
    try {
      const result = await chatSync({ systemPrompt, prompt, maxTokens: 2500 });
      summary = result.text;
    } catch (e) {
      console.error("[summary] sarvam error:", e);
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 502 },
      );
    }

    if (!summary.trim()) {
      return NextResponse.json(
        { error: "Empty summary from inference" },
        { status: 502 },
      );
    }

    // Save the summary to the consultation
    await supabase
      .from("larinova_consultations")
      .update({
        ai_summary: summary.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    // Record AI usage
    await recordAIUsage(doctor.id, "summary", consultationId);

    return NextResponse.json({
      success: true,
      summary: summary.trim(),
      transcriptCount: transcripts.length,
      durationMinutes,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get the saved summary for a consultation
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

    const { data: consultation, error } = await supabase
      .from("larinova_consultations")
      .select("ai_summary")
      .eq("id", consultationId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch summary" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      summary: consultation?.ai_summary || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
