import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const model = (formData.get("model") as string) || "whisper-1";
    const language = formData.get("language") as string;
    const responseFormat =
      (formData.get("response_format") as string) || "json";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model,
      ...(language && { language }),
      response_format: responseFormat as any,
    });

    return NextResponse.json(transcription);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
