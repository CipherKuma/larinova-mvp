import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;
    const {
      speaker,
      text,
      translation,
      confidence,
      timestamp_start,
      timestamp_end,
      language,
    } = await req.json();

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Save transcript to database
    const { data: transcript, error } = await supabase
      .from("larinova_transcripts")
      .insert({
        consultation_id: consultationId,
        speaker: speaker || "unknown",
        text,
        translation: translation || null,
        language: language || "en",
        confidence: confidence || 0,
        timestamp_start: timestamp_start || 0,
        timestamp_end: timestamp_end || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save transcript" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, transcript });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get all transcripts for a consultation
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

    const { data: transcripts, error } = await supabase
      .from("larinova_transcripts")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("timestamp_start", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch transcripts" },
        { status: 500 },
      );
    }

    return NextResponse.json({ transcripts });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
