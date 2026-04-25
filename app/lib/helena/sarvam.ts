const SARVAM_BASE_URL = "https://api.sarvam.ai/v1";

export type SarvamMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SarvamChatOptions = {
  messages: SarvamMessage[];
  model?: string;
  maxTokens?: number;
  reasoningEffort?: "low" | "medium" | "high";
};

export type SarvamChatResult = {
  text: string;
  rawText: string;
  finishReason: string;
  promptTokens: number;
  completionTokens: number;
};

function stripReasoning(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
}

export async function sarvamChat(
  opts: SarvamChatOptions,
): Promise<SarvamChatResult> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY not configured");

  const body = {
    model: opts.model ?? "sarvam-m",
    messages: opts.messages,
    max_completion_tokens: opts.maxTokens ?? 2000,
    reasoning_effort: opts.reasoningEffort ?? "low",
  };

  const res = await fetch(`${SARVAM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Sarvam ${res.status}: ${errBody.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{
      finish_reason: string;
      message: { content: string | null; reasoning_content?: string | null };
    }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const choice = data.choices?.[0];
  const rawText = choice?.message?.content ?? "";

  return {
    text: stripReasoning(rawText),
    rawText,
    finishReason: choice?.finish_reason ?? "unknown",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
}
