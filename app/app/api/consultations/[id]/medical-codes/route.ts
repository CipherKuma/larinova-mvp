import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIUsage, recordAIUsage } from "@/lib/subscription";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "https://claude.fierypools.fun";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

interface CodeItem {
  code: string;
  description: string;
}

interface MedicalCodesResponse {
  icd10: CodeItem[];
  snomed: CodeItem[];
  cpt: CodeItem[];
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;
    const { soapNote } = await req.json();

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check AI usage limits
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id, locale")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const usage = await checkAIUsage(doctor.id, "medical_codes");
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error:
            "Free trial limit reached for medical code generation. Upgrade to Pro for unlimited access.",
          usage,
          upgrade_required: true,
        },
        { status: 403 },
      );
    }

    // If no SOAP note provided, try to get it from the database
    let finalSoapNote = soapNote;
    if (!finalSoapNote) {
      const { data: consultation, error } = await supabase
        .from("larinova_consultations")
        .select("soap_note")
        .eq("id", consultationId)
        .single();

      if (error || !consultation?.soap_note) {
        return NextResponse.json(
          { error: "No SOAP note found. Please generate a SOAP note first." },
          { status: 400 },
        );
      }

      finalSoapNote = consultation.soap_note;
    }

    const locale = (doctor.locale as string) ?? "in";
    const isId = locale === "id";
    const lang = isId ? "Bahasa Indonesia" : "English";

    const systemPrompt = `You are a medical coding AI. Extract ICD-10 and CPT codes from SOAP notes. Return ONLY a valid JSON object: {"icd10": [{"code": "X00.0", "description": "brief condition name in ${lang}"}], "cpt": [{"code": "00000", "description": "brief procedure name in ${lang}"}]}. Rules: ICD-10 for all diagnoses (primary first), CPT for office visit + any procedures/tests ordered, valid official codes only, descriptions 3-6 words in ${lang}, return ONLY the JSON with no other text.`;

    const prompt = `Extract medical codes from this SOAP note:\n\n${finalSoapNote}`;

    // Call Claude service
    const claudeResponse = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        systemPrompt,
        prompt,
        model: "haiku",
        maxTurns: 1,
        workingDirectory: "/tmp",
      }),
    });

    if (!claudeResponse.ok) {
      return NextResponse.json(
        { error: "Failed to extract medical codes" },
        { status: 500 },
      );
    }

    // Parse response from Claude
    const responseText = await claudeResponse.text();
    const lines = responseText.split("\n").filter((line) => line.trim());

    let codesText = "";
    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        if (event.type === "claude_event") {
          // Handle assistant message with content array (non-streaming format)
          if (event.data?.type === "assistant") {
            const content = event.data.message?.content;
            if (content && Array.isArray(content)) {
              for (const block of content) {
                if (block.type === "text") {
                  codesText += block.text;
                }
              }
            }
          }
          // Also handle streaming text_delta format (fallback)
          if (
            event.data?.type === "content_block_delta" &&
            event.data.delta?.type === "text_delta"
          ) {
            codesText += event.data.delta.text;
          }
        }
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }

    if (!codesText.trim()) {
      return NextResponse.json(
        { error: "Failed to extract medical codes from Claude response" },
        { status: 500 },
      );
    }

    // Parse the JSON response from Claude
    let medicalCodes: MedicalCodesResponse;
    try {
      // Extract outermost JSON object from the response
      const firstBrace = codesText.indexOf("{");
      const lastBrace = codesText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        medicalCodes = JSON.parse(codesText.slice(firstBrace, lastBrace + 1));
      } else {
        medicalCodes = JSON.parse(codesText);
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse medical codes from response" },
        { status: 500 },
      );
    }

    // Update consultation with the medical codes
    await supabase
      .from("larinova_consultations")
      .update({
        medical_codes: medicalCodes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    // Record AI usage
    await recordAIUsage(doctor.id, "medical_codes", consultationId);

    return NextResponse.json({
      success: true,
      medicalCodes,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get the saved medical codes for a consultation
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: consultation, error } = await supabase
      .from("larinova_consultations")
      .select("medical_codes")
      .eq("id", consultationId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch medical codes" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      medicalCodes: consultation?.medical_codes || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
