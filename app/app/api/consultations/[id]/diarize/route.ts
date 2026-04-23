import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "https://claude.fierypools.fun";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

interface DiarizedSegment {
  speaker: "doctor" | "patient";
  text: string;
  timestamp_start: number;
  timestamp_end: number;
}

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

    // Get all transcripts for this consultation
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

    // Combine all transcripts into a single conversation text with timestamps
    const conversationWithTimestamps = transcripts
      .map(
        (t, index) =>
          `[${index + 1}] (${t.timestamp_start.toFixed(1)}s - ${t.timestamp_end.toFixed(1)}s): ${t.text}`,
      )
      .join("\n");

    const systemPrompt = `You are a medical conversation diarization expert. Analyze transcribed medical consultations and label each segment as "doctor" or "patient". Doctors ask questions, give medical advice, explain diagnoses, prescribe treatments. Patients describe symptoms, provide history, ask about their condition. Return ONLY a valid JSON array: [{"index": 1, "speaker": "doctor", "text": "original text"}, ...]. Rules: keep original text unchanged, speaker must be exactly "doctor" or "patient" (lowercase), include ALL segments in order, return ONLY the JSON array with no other text.`;

    const prompt = `Transcribed Conversation:\n"""\n${conversationWithTimestamps}\n"""`;

    // Call Claude service
    let claudeResponse;
    try {
      claudeResponse = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
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
    } catch (fetchError: any) {
      return NextResponse.json(
        {
          error: `Claude service unavailable: ${fetchError.message}. Make sure the Claude service is running.`,
        },
        { status: 503 },
      );
    }

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      return NextResponse.json(
        {
          error: `Claude service error (${claudeResponse.status}): ${errorText}`,
        },
        { status: 500 },
      );
    }

    // Parse response from Claude
    const responseText = await claudeResponse.text();
    const lines = responseText.split("\n").filter((line) => line.trim());

    let diarizedText = "";
    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        if (event.type === "claude_event") {
          // Handle assistant message with content array (non-streaming format)
          if (event.data?.type === "assistant") {
            const content = event.data.message?.content;
            if (content && Array.isArray(content)) {
              for (const block of content) {
                if (block.type === "text") {
                  diarizedText += block.text;
                }
              }
            }
          }
          // Also handle streaming text_delta format (fallback)
          if (
            event.data?.type === "content_block_delta" &&
            event.data.delta?.type === "text_delta"
          ) {
            diarizedText += event.data.delta.text;
          }
        }
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }

    if (!diarizedText.trim()) {
      return NextResponse.json(
        {
          error: "Failed to extract diarized conversation from Claude response",
        },
        { status: 500 },
      );
    }

    // Parse the JSON response from Claude
    let diarizedSegments: Array<{
      index: number;
      speaker: "doctor" | "patient";
      text: string;
    }>;
    try {
      // Extract JSON array from the response
      const jsonMatch = diarizedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }
      diarizedSegments = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse diarized conversation" },
        { status: 500 },
      );
    }

    // Update each transcript in the database with the identified speaker
    const updatePromises = diarizedSegments.map(async (segment) => {
      const originalTranscript = transcripts[segment.index - 1];
      if (originalTranscript) {
        await supabase
          .from("larinova_transcripts")
          .update({ speaker: segment.speaker })
          .eq("id", originalTranscript.id);

        return {
          ...originalTranscript,
          speaker: segment.speaker,
        };
      }
      return null;
    });

    const updatedTranscripts = (await Promise.all(updatePromises)).filter(
      Boolean,
    );

    // Mark consultation as diarized
    await supabase
      .from("larinova_consultations")
      .update({
        diarized: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    return NextResponse.json({
      success: true,
      transcripts: updatedTranscripts,
      segmentCount: updatedTranscripts.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
