import { createClient } from "@/lib/supabase/server";
import {
  createRealtimeTranscriber,
  detectSpeaker,
} from "@/lib/assemblyai/transcription";
import { NextRequest } from "next/server";

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get doctor info
    const { data: doctor, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ error: "Doctor profile not found" }),
        { status: 404 },
      );
    }

    // Verify consultation belongs to this doctor and is in progress
    const { data: consultation, error: consultationError } = await supabase
      .from("larinova_consultations")
      .select("id, doctor_id, status")
      .eq("id", id)
      .single();

    if (consultationError || !consultation) {
      return new Response(JSON.stringify({ error: "Consultation not found" }), {
        status: 404,
      });
    }

    if (consultation.doctor_id !== doctor.id) {
      return new Response(
        JSON.stringify({
          error: "You do not have permission to transcribe this consultation",
        }),
        { status: 403 },
      );
    }

    if (consultation.status !== "in_progress") {
      return new Response(
        JSON.stringify({ error: "Consultation is not in progress" }),
        { status: 400 },
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Create realtime transcriber
        const transcriber = createRealtimeTranscriber();

        // Handle transcription events
        transcriber.on("transcript", async (transcript) => {
          if (
            transcript.message_type === "FinalTranscript" &&
            transcript.text
          ) {
            // Speaker detection is handled client-side via WebSocket
            const speaker = "unknown";

            // Save transcript to database
            const { error: insertError } = await supabase
              .from("larinova_transcripts")
              .insert({
                consultation_id: id,
                speaker,
                text: transcript.text,
                language: "en",
                confidence: transcript.confidence || 0,
                timestamp_start: 0,
                timestamp_end: 0,
              });

            // Send transcript to client via SSE
            const data = JSON.stringify({
              type: "transcript",
              speaker,
              text: transcript.text,
              confidence: transcript.confidence || 0,
              timestamp: 0,
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        });

        transcriber.on("error", (error) => {
          const data = JSON.stringify({
            type: "error",
            message: error.message,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        });

        // Connect to AssemblyAI
        await transcriber.connect();

        // Send ready signal
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "ready" })}\n\n`),
        );

        // Handle audio data from request body
        const reader = request.body?.getReader();
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Send audio data to AssemblyAI
              if (value) {
                transcriber.sendAudio(value.buffer);
              }
            }
          } catch {
            // stream read error — close gracefully
          } finally {
            await transcriber.close();
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
