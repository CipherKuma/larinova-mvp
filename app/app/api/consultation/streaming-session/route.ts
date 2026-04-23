import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getTranscriptionProvider } from "@/lib/transcription";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("locale")
    .eq("user_id", user.id)
    .single();

  const locale: "in" | "id" = doctor?.locale === "id" ? "id" : "in";

  if (locale !== "in") {
    return NextResponse.json(
      { error: "Streaming session only available for India locale" },
      { status: 400 },
    );
  }

  try {
    const provider = getTranscriptionProvider("in");
    if (provider.mode !== "streaming") {
      return NextResponse.json(
        { error: "Not a streaming provider" },
        { status: 500 },
      );
    }

    const session = await provider.getStreamingSession({});
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create streaming session" },
      { status: 500 },
    );
  }
}
