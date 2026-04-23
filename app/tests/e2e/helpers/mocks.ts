import { type Page } from "@playwright/test";

/**
 * Intercept external AI/speech API calls and return deterministic mock responses.
 * Call this in beforeEach or in a fixture to keep tests fast and offline-safe.
 */
export async function mockExternalAPIs(page: Page): Promise<void> {
  // --- OpenAI Chat Completions ---
  await page.route("**/api.openai.com/v1/chat/completions", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "chatcmpl-mock-001",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mock",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "Based on the symptoms described, the patient presents with mild upper respiratory infection. Recommend rest, fluids, and follow-up in 5 days if symptoms persist.",
            },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 40, total_tokens: 90 },
      }),
    }),
  );

  // --- Deepgram Transcription ---
  await page.route("**/api.deepgram.com/v1/listen**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        metadata: {
          request_id: "mock-deepgram-001",
          created: new Date().toISOString(),
          duration: 12.5,
          channels: 1,
        },
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript:
                    "The patient reports a persistent cough for the past three days along with mild fever and body aches.",
                  confidence: 0.98,
                  words: [
                    { word: "The", start: 0.0, end: 0.1, confidence: 0.99 },
                    {
                      word: "patient",
                      start: 0.1,
                      end: 0.4,
                      confidence: 0.99,
                    },
                    {
                      word: "reports",
                      start: 0.4,
                      end: 0.7,
                      confidence: 0.98,
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    }),
  );

  // --- AssemblyAI Transcript ---
  await page.route("**/api.assemblyai.com/v2/transcript", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "mock-assemblyai-001",
          status: "completed",
          text: "The patient reports a persistent cough for the past three days along with mild fever and body aches.",
          audio_duration: 12.5,
          confidence: 0.97,
          words: [
            { text: "The", start: 0, end: 100, confidence: 0.99 },
            { text: "patient", start: 100, end: 400, confidence: 0.99 },
          ],
        }),
      });
    }
    // GET for status polling
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "mock-assemblyai-001",
        status: "completed",
        text: "The patient reports a persistent cough for the past three days along with mild fever and body aches.",
      }),
    });
  });

  // --- AssemblyAI Transcript by ID ---
  await page.route("**/api.assemblyai.com/v2/transcript/*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "mock-assemblyai-001",
        status: "completed",
        text: "The patient reports a persistent cough for the past three days along with mild fever and body aches.",
        audio_duration: 12.5,
        confidence: 0.97,
      }),
    }),
  );

  // --- Speechmatics ---
  await page.route("**/asr.api.speechmatics.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        format: "2.9",
        metadata: {
          created_at: new Date().toISOString(),
          type: "transcription",
          language: "en",
        },
        results: [
          {
            type: "word",
            start_time: 0.0,
            end_time: 0.3,
            alternatives: [{ content: "The", confidence: 0.99 }],
          },
          {
            type: "word",
            start_time: 0.3,
            end_time: 0.6,
            alternatives: [{ content: "patient", confidence: 0.99 }],
          },
        ],
      }),
    }),
  );

  // --- Speechmatics Auth Token ---
  await page.route("**/mp.speechmatics.com/v1/api_keys**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        key_value: "mock-speechmatics-token",
      }),
    }),
  );
}
