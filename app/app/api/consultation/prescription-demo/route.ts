import { NextRequest, NextResponse } from "next/server";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "https://claude.fierypools.fun";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

interface PrescriptionMedicine {
  name: string;
  frequency: string;
  duration: string;
  timing: string;
}

interface PrescriptionData {
  patient_name: string;
  patient_sex: string;
  patient_age: string;
  medicines: PrescriptionMedicine[];
}

export async function POST(request: NextRequest) {
  try {
    const { soapNote, transcript, locale } = await request.json();

    if (!soapNote && !transcript) {
      return NextResponse.json(
        { error: "soapNote or transcript required" },
        { status: 400 },
      );
    }

    const isIndonesia = locale === "id";

    const prompt = `You are a medical prescription assistant. Based on the SOAP note and consultation transcript below, generate a realistic prescription.

IMPORTANT RULES:
1. Extract the patient's name from the transcript if mentioned. If no name is found, use "${isIndonesia ? "Siti Rahayu" : "Ravi Kumar"}" as the default.
2. Determine the patient's sex from context clues (pronouns, title like Mr/Mrs/Pak/Bu). Default to "${isIndonesia ? "F" : "M"}" if unclear.
3. Estimate the patient's age from context. Default to "45" if not mentioned.
4. Generate 2-4 appropriate medicines based on the diagnosis/assessment in the SOAP note.
5. Each medicine MUST have: name (drug name + dosage), frequency, duration, and timing.
6. Use REAL medicine names appropriate for the diagnosis. Do NOT use placeholder medicines.
7. ${isIndonesia ? 'Use Indonesian format: frequency as "3x1" or "2x1", duration in "hari", timing in Indonesian (e.g., "Sesudah makan", "Sebelum makan").' : 'Use Indian format: frequency as "1-0-1" or "1-1-1", duration in "days", timing in English (e.g., "After food", "Before food").'}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "patient_name": "Name Here",
  "patient_sex": "M" or "F",
  "patient_age": "45",
  "medicines": [
    {
      "name": "DRUG NAME DOSAGE",
      "frequency": "frequency",
      "duration": "duration",
      "timing": "timing"
    }
  ]
}

SOAP Note:
${soapNote ? JSON.stringify(soapNote) : "Not available"}

Consultation Transcript:
${transcript || "Not available"}`;

    const claudeResponse = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        model: "sonnet",
        maxTurns: 1,
        workingDirectory: "/tmp",
      }),
    });

    if (!claudeResponse.ok) {
      console.error("[PRESCRIPTION-DEMO] Claude error:", claudeResponse.status);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 },
      );
    }

    // Parse SSE response from Claude Service
    const responseText = await claudeResponse.text();
    const lines = responseText.split("\n").filter((line) => line.trim());
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
      console.error("[PRESCRIPTION-DEMO] Empty AI response");
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    // Parse JSON from AI response
    let prescription: PrescriptionData;
    try {
      let cleaned = aiText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\s*\n?/, "")
          .replace(/\n?```\s*$/, "");
      }
      prescription = JSON.parse(cleaned);
    } catch {
      // Try extracting JSON object from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(
          "[PRESCRIPTION-DEMO] Failed to parse:",
          aiText.substring(0, 200),
        );
        return NextResponse.json(
          { error: "Failed to parse prescription data" },
          { status: 500 },
        );
      }
      prescription = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json({ prescription });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Prescription generation failed";
    console.error("[PRESCRIPTION-DEMO] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
