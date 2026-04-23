import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/sarvam/client";
import { getTranscriptionProvider } from "@/lib/transcription";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const languageCode = (formData.get("language_code") as string) || "hi-IN";
    const clientLocale = formData.get("locale") as string | null;

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("locale")
      .eq("user_id", user.id)
      .single();

    const locale: "in" | "id" =
      doctor?.locale === "id" ? "id" : clientLocale === "id" ? "id" : "in";

    console.error("[TRANSCRIBE] Request:", {
      locale,
      languageCode,
      clientLocale,
      doctorLocale: doctor?.locale,
      fileSize: file?.size ?? 0,
      fileType: file?.type ?? "none",
    });

    if (!file) {
      console.error("[TRANSCRIBE] No audio file in request");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      console.error("[TRANSCRIBE] Audio file is empty (0 bytes)");
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 },
      );
    }

    if (locale === "in") {
      // India: Sarvam chunk-based transcription
      const apiKey = process.env.SARVAM_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "SARVAM_API_KEY not configured" },
          { status: 500 },
        );
      }
      console.error("[TRANSCRIBE] Using Sarvam for India locale");
      const result = await transcribeAudio(apiKey, file, languageCode);
      console.error("[TRANSCRIBE] Sarvam result:", {
        transcriptLength: result.transcript?.length ?? 0,
      });
      return NextResponse.json(result);
    }

    // Indonesia: Deepgram batch transcription (full audio)
    console.error("[TRANSCRIBE] Using Deepgram batch for Indonesia locale");
    const provider = getTranscriptionProvider("id");
    if (provider.mode !== "batch") {
      return NextResponse.json(
        { error: "Invalid provider mode" },
        { status: 500 },
      );
    }
    const result = await provider.transcribe(file, { language: "id" });
    console.error("[TRANSCRIBE] Deepgram result:", {
      transcriptLength: result.transcript?.length ?? 0,
      segmentCount: result.segments?.length ?? 0,
    });
    return NextResponse.json({
      transcript: result.transcript,
      segments: result.segments,
      language_code: "id",
      provider: "deepgram",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[TRANSCRIBE] ERROR:", { message, stack });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
