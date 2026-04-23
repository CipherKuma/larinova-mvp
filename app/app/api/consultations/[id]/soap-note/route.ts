import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSoapSystemPrompt } from "@/lib/soap/prompts";
import type { Locale } from "@/src/i18n/routing";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "https://claude.fierypools.fun";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

function extractTextFromSseResponse(responseText: string): string {
  const lines = responseText.split("\n").filter((line) => line.trim());
  let text = "";

  for (const line of lines) {
    try {
      const event = JSON.parse(line);

      if (event.type === "claude_event") {
        // Non-streaming: full assistant message
        if (event.data?.type === "assistant") {
          const content = event.data.message?.content;
          if (content && Array.isArray(content)) {
            for (const block of content) {
              if (block.type === "text") text += block.text;
            }
          }
        }
        // Streaming: text delta
        if (
          event.data?.type === "content_block_delta" &&
          event.data.delta?.type === "text_delta"
        ) {
          text += event.data.delta.text;
        }
      }
    } catch {
      // skip non-JSON lines
    }
  }

  return text;
}

// POST — generate a SOAP note from consultation transcripts
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor record to determine locale
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("locale")
      .eq("user_id", user.id)
      .single();

    const locale: Locale = (doctor?.locale as Locale) ?? "in";

    // Fetch all transcripts for this consultation
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

    // Fetch patient demographics for context
    const { data: consultationRecord } = await supabase
      .from("larinova_consultations")
      .select(
        "patient_id, larinova_patients!patient_id(full_name, gender, date_of_birth, blood_group)",
      )
      .eq("id", consultationId)
      .single();

    const patientInfo = consultationRecord?.larinova_patients as
      | {
          full_name: string;
          gender: string | null;
          date_of_birth: string | null;
          blood_group: string | null;
        }
      | null
      | undefined;

    // Build conversation text from transcripts
    const conversationText = transcripts
      .map((t) => `[${t.speaker?.toUpperCase() || "UNKNOWN"}]: ${t.text}`)
      .join("\n\n");

    // Build locale-aware system prompt
    const systemPrompt = buildSoapSystemPrompt(locale);

    // Build patient context block
    const patientContext = patientInfo
      ? [
          `Patient: ${patientInfo.full_name}`,
          patientInfo.gender ? `Gender: ${patientInfo.gender}` : null,
          patientInfo.date_of_birth
            ? `Date of Birth: ${patientInfo.date_of_birth}`
            : null,
          patientInfo.blood_group
            ? `Blood Group: ${patientInfo.blood_group}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const prompt = patientContext
      ? `${patientContext}\n\nTranscribed Conversation:\n"""\n${conversationText}\n"""`
      : `Transcribed Conversation:\n"""\n${conversationText}\n"""`;

    // Call Claude Service
    const claudeResponse = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        systemPrompt,
        prompt,
        model: "sonnet",
        maxTurns: 1,
        workingDirectory: "/tmp",
      }),
    });

    if (!claudeResponse.ok) {
      return NextResponse.json(
        { error: "Failed to generate SOAP note" },
        { status: 500 },
      );
    }

    const responseText = await claudeResponse.text();
    const soapNote = extractTextFromSseResponse(responseText);

    if (!soapNote.trim()) {
      return NextResponse.json(
        { error: "Failed to extract SOAP note from Claude response" },
        { status: 500 },
      );
    }

    // Persist SOAP note with locale tag (continue even if save fails)
    await supabase
      .from("larinova_consultations")
      .update({
        soap_note: soapNote.trim(),
        soap_note_locale: locale,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    return NextResponse.json({
      success: true,
      soapNote: soapNote.trim(),
      transcriptCount: transcripts.length,
      locale,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET — retrieve saved SOAP note for a consultation
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: consultation, error } = await supabase
      .from("larinova_consultations")
      .select("soap_note, soap_note_locale")
      .eq("id", consultationId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch SOAP note" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      soapNote: consultation?.soap_note || null,
      locale: consultation?.soap_note_locale || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
