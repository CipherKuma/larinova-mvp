import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 },
      );
    }

    // Create temporary token for Universal Streaming API
    const response = await fetch(
      "https://api.assemblyai.com/v2/streaming/token",
      {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expires_in: 3600 }), // 1 hour
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create token");
    }

    return NextResponse.json({ token: data.token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create token" },
      { status: 500 },
    );
  }
}
