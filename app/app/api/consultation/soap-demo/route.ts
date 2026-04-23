// Demo SOAP generation for onboarding preview — no consultation ID required.
// Used by the StepMagic onboarding step to show doctors a sample SOAP note.
// Full SOAP generation for real consultations is at /api/consultations/[id]/soap-note.

import { NextRequest, NextResponse } from "next/server";
import { buildSoapDemoPrompt, getSoapFallback } from "@/lib/sarvam/prompts";
import type { Locale } from "@/src/i18n/routing";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "https://claude.fierypools.fun";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, locale: rawLocale } = body;
    const locale: Locale = rawLocale === "id" ? "id" : "in";

    if (!transcript) {
      return NextResponse.json(
        { error: "transcript required" },
        { status: 400 },
      );
    }

    const soapPrompt = buildSoapDemoPrompt(locale);
    const fallback = getSoapFallback(locale);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const claudeResponse = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": CLAUDE_API_KEY,
        },
        body: JSON.stringify({
          prompt: `${soapPrompt}\n\nTranscript:\n${transcript}`,
          model: "sonnet",
          maxTurns: 1,
          workingDirectory: "/tmp",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!claudeResponse.ok) {
        console.error("[SOAP-DEMO] Claude error:", claudeResponse.status);
        throw new Error(`Claude error: ${claudeResponse.status}`);
      }

      // Parse SSE response
      const responseText = await claudeResponse.text();
      const lines = responseText.split("\n").filter((l) => l.trim());
      let aiText = "";

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.type === "claude_event") {
            if (event.data?.type === "assistant") {
              const content = event.data.message?.content;
              if (content && Array.isArray(content)) {
                for (const block of content) {
                  if (block.type === "text") aiText += block.text;
                }
              }
            }
            if (
              event.data?.type === "content_block_delta" &&
              event.data.delta?.type === "text_delta"
            ) {
              aiText += event.data.delta.text;
            }
          }
        } catch {
          continue;
        }
      }

      if (!aiText.trim()) {
        throw new Error("Empty response from AI");
      }

      // Strip markdown fences if present
      let cleaned = aiText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\s*\n?/, "")
          .replace(/\n?```\s*$/, "");
      }

      try {
        const soap = JSON.parse(cleaned);
        return NextResponse.json({ soap, fallback: false });
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const soap = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ soap, fallback: false });
        }
        return NextResponse.json({
          soap: { ...fallback, subjective: aiText || transcript },
          fallback: true,
        });
      }
    } catch {
      clearTimeout(timeout);
      return NextResponse.json({
        soap: { ...fallback, subjective: transcript },
        fallback: true,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "SOAP demo generation failed" },
      { status: 500 },
    );
  }
}
