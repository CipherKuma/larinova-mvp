import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies audio transcription to OpenAI's Whisper endpoint.
 *
 * Uses direct fetch rather than the `openai` SDK to avoid a Turbopack
 * static-analysis failure in openai@6.22.0 (export Skills missing from
 * resources/index.mjs). Payload shape is identical.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const model = (formData.get("model") as string) || "whisper-1";
    const language = formData.get("language") as string | null;
    const responseFormat =
      (formData.get("response_format") as string) || "json";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const openaiForm = new FormData();
    openaiForm.append("file", file);
    openaiForm.append("model", model);
    openaiForm.append("response_format", responseFormat);
    if (language) openaiForm.append("language", language);

    const upstream = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: openaiForm,
      },
    );

    if (!upstream.ok) {
      const body = await upstream.text();
      return NextResponse.json(
        { error: `OpenAI ${upstream.status}: ${body}` },
        { status: upstream.status },
      );
    }

    if (responseFormat === "json" || responseFormat === "verbose_json") {
      const data = await upstream.json();
      return NextResponse.json(data);
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to transcribe audio";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
