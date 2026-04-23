import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({ apiKey });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get API key" },
      { status: 500 },
    );
  }
}
