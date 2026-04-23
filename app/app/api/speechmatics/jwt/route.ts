import { NextResponse } from "next/server";
import { createSpeechmaticsJWT } from "@speechmatics/auth";

export async function POST() {
  try {
    const apiKey = process.env.SPEECHMATICS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Speechmatics API key not configured" },
        { status: 500 },
      );
    }

    // Create a JWT for real-time transcription (60 minute TTL)
    const jwt = await createSpeechmaticsJWT({
      type: "rt",
      apiKey,
      ttl: 3600, // 60 minutes
    });

    return NextResponse.json({ jwt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create JWT" },
      { status: 500 },
    );
  }
}
