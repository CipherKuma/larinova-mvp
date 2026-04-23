import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      "https://api.assemblyai.com/v2/realtime/token",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expires_in: 3600,
          encoding: "pcm_s16le",
          sample_rate: 16000,
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get AssemblyAI token" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
