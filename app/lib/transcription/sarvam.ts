import type {
  StreamingTranscriptionProvider,
  TranscribeOptions,
  TranscriptSegment,
  TranscriptionResult,
} from "./types";

function getApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY not configured");
  return key;
}

export const sarvamStreamingProvider: StreamingTranscriptionProvider = {
  mode: "streaming",
  name: "sarvam",

  async getStreamingSession(_opts: TranscribeOptions) {
    return {
      token: getApiKey(),
      wsUrl: "wss://api.sarvam.ai/speech-to-text/ws",
      expiresAt: Date.now() + 3600 * 1000,
    };
  },

  async finalize(segments: TranscriptSegment[]): Promise<TranscriptionResult> {
    return {
      transcript: segments.map((s) => s.text).join(" "),
      segments,
      provider: "sarvam",
    };
  },

  async translate(text: string, from: string, to: string): Promise<string> {
    const apiKey = getApiKey();
    const requestBody = {
      input: text,
      source_language_code: from,
      target_language_code: to || "en-IN",
    };

    console.error("[SARVAM_TRANSLATE] Request:", {
      from,
      to: to || "en-IN",
      inputLength: text.length,
    });

    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "API-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[SARVAM_TRANSLATE] API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        requestBody: { ...requestBody, input: text.substring(0, 50) + "..." },
      });
      throw new Error(
        `Sarvam translate error: ${response.status} — ${errorBody || response.statusText}`,
      );
    }

    const result = await response.json();
    console.error("[SARVAM_TRANSLATE] Success:", {
      outputLength: result.translated_text?.length ?? 0,
    });
    return result.translated_text || text;
  },
};
