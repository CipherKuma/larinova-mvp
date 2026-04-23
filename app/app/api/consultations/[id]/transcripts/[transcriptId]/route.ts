import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; transcriptId: string }> },
) {
  try {
    const { transcriptId } = await params;
    const { text, translation, timestamp_end } = await req.json();

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update transcript in database
    const { data: transcript, error } = await supabase
      .from("larinova_transcripts")
      .update({
        text,
        translation: translation || null,
        timestamp_end: timestamp_end || 0,
      })
      .eq("id", transcriptId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update transcript" },
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
