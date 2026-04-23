import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("locale")
      .eq("user_id", user.id)
      .single();

    const locale: "in" | "id" = doctor?.locale === "id" ? "id" : "in";

    const body = await request.json();
    const { text, sourceLang, targetLang } = body;

    console.error("[TRANSLATE] Request:", {
      locale,
      sourceLang,
      targetLang: targetLang || "en-IN",
      textLength: text?.length ?? 0,
      textPreview: text?.substring(0, 100),
    });

    if (!text || !sourceLang) {
      console.error("[TRANSLATE] Missing required fields:", {
        hasText: !!text,
        hasSourceLang: !!sourceLang,
      });
      return NextResponse.json(
        { error: "text and sourceLang required" },
        { status: 400 },
      );
    }

    const provider = getTranscriptionProvider(locale);
    console.error(
      `[TRANSLATE] Using provider: ${provider.name} (${provider.mode}) for locale: ${locale}`,
    );

    const translated = await provider.translate(
      text,
      sourceLang,
      targetLang || "en-IN",
    );

    console.error("[TRANSLATE] Success:", {
      outputLength: translated?.length ?? 0,
      outputPreview: translated?.substring(0, 100),
    });

    return NextResponse.json({ translated_text: translated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Translation failed";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[TRANSLATE] ERROR:", { message, stack });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
