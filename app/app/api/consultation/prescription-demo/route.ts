import { NextRequest, NextResponse } from "next/server";
import { chatSync, extractJson } from "@/lib/ai/sarvam";
import {
  buildPrescriptionDemoPrompt,
  getEmptyPrescription,
  hasExplicitMedicineMention,
  sanitizePrescriptionDemo,
  sourceTextForPrescription,
  type PrescriptionData,
} from "@/lib/onboarding/prescription-demo";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { soapNote, transcript, locale } = await request.json();

    if (!soapNote && !transcript) {
      return NextResponse.json(
        { error: "soapNote or transcript required" },
        { status: 400 },
      );
    }

    const sourceText = sourceTextForPrescription(soapNote, transcript);
    if (!hasExplicitMedicineMention(sourceText)) {
      return NextResponse.json({
        prescription: getEmptyPrescription(locale),
        medicineSource: "none_explicit",
      });
    }

    const prompt = buildPrescriptionDemoPrompt({
      soapNote,
      transcript,
      locale,
    });

    let aiText = "";
    try {
      const result = await chatSync({ prompt, maxTokens: 1500 });
      aiText = result.text;
    } catch (e) {
      console.error("[PRESCRIPTION-DEMO] sarvam error:", e);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 },
      );
    }

    if (!aiText.trim()) {
      console.error("[PRESCRIPTION-DEMO] Empty AI response");
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    let prescription: PrescriptionData;
    try {
      prescription = extractJson<PrescriptionData>(aiText);
    } catch {
      console.error(
        "[PRESCRIPTION-DEMO] Failed to parse:",
        aiText.substring(0, 200),
      );
      return NextResponse.json(
        { error: "Failed to parse prescription data" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      prescription: sanitizePrescriptionDemo(prescription, sourceText, locale),
      medicineSource: "explicit_only",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Prescription generation failed";
    console.error("[PRESCRIPTION-DEMO] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
