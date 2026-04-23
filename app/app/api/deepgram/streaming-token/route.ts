import { NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

/**
 * POST /api/deepgram/streaming-token
 *
 * Returns a short-lived Deepgram API key scoped to live transcription only.
 * Clients use this token to open a WebSocket to wss://api.deepgram.com/v1/listen.
 *
 * If DEEPGRAM_PROJECT_ID is set, we create a proper temporary key via the
 * Deepgram Management API (expires in 10 seconds — the client must connect
 * within that window). Otherwise we fall back to the main API key.
 */
export async function POST() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 },
      );
    }

    const projectId = process.env.DEEPGRAM_PROJECT_ID;

    if (projectId) {
      const deepgram = createClient(apiKey);
      const { result, error } = await deepgram.manage.createProjectKey(
        projectId,
        {
          comment: "live-transcription-session",
          scopes: ["usage:write"],
          time_to_live_in_seconds: 10,
          tags: ["streaming"],
        },
      );

      if (error) {
        return NextResponse.json(
          { error: "Failed to create streaming token" },
          { status: 500 },
        );
      }

      return NextResponse.json({ token: result.key });
    }

    // Fallback: return the main API key when no project ID is configured.
    // This is acceptable for low-traffic MVP usage; rotate to temp keys in production.
    return NextResponse.json({ token: apiKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
