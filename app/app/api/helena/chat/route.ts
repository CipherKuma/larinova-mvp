import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  HelenaChatRequest,
  DocumentType,
  DOCUMENT_TYPES,
} from "@/types/helena";
import { checkAIUsage, recordAIUsage } from "@/lib/subscription";
import { buildHelenaSystemPrompt } from "@/lib/helena/prompts";
import type { Locale } from "@/src/i18n/routing";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL || "https://claude.fierypools.fun";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

// Parse document from response
function parseDocumentFromResponse(response: string): {
  message: string;
  documentContent: string | null;
  documentTitle: string | null;
} {
  const docStartMarker = "---DOCUMENT_START---";
  const docEndMarker = "---DOCUMENT_END---";

  const startIdx = response.indexOf(docStartMarker);
  const endIdx = response.indexOf(docEndMarker);

  if (startIdx === -1 || endIdx === -1) {
    return { message: response, documentContent: null, documentTitle: null };
  }

  const beforeDoc = response.substring(0, startIdx).trim();
  const afterDoc = response.substring(endIdx + docEndMarker.length).trim();
  const docContent = response
    .substring(startIdx + docStartMarker.length, endIdx)
    .trim();

  // Extract title
  let documentTitle = "Generated Document";
  let documentContent = docContent;

  const titleMatch = docContent.match(/^TITLE:\s*(.+?)(?:\n|$)/);
  if (titleMatch) {
    documentTitle = titleMatch[1].trim();
    documentContent = docContent.substring(titleMatch[0].length).trim();
  }

  const message =
    [beforeDoc, afterDoc].filter(Boolean).join("\n\n") ||
    `I've generated the document "${documentTitle}" for you. You can view it in the Documents section.`;

  return { message, documentContent, documentTitle };
}

export async function POST(req: Request) {
  try {
    const body: HelenaChatRequest = await req.json();
    const {
      message,
      conversation_id,
      patient_id,
      document_type,
      generate_document,
    } = body;

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info (includes locale column)
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check AI usage limits
    const usage = await checkAIUsage(doctor.id, "helena_chat");
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error:
            "Free trial limit reached for Helena. Upgrade to Pro for unlimited access.",
          usage,
          upgrade_required: true,
        },
        { status: 403 },
      );
    }

    // Get or create conversation
    let conversationId = conversation_id;
    let conversation;
    let conversationLocale: Locale = (doctor.locale as Locale) ?? "in";

    if (conversationId) {
      const { data: existingConv } = await supabase
        .from("helena_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      conversation = existingConv;

      // Existing conversation's stored locale wins over current URL locale
      if (existingConv?.locale) {
        conversationLocale = existingConv.locale as Locale;
      }
    }

    if (!conversation) {
      // New conversation inherits the doctor's current locale
      const { data: newConv, error: convError } = await supabase
        .from("helena_conversations")
        .insert({
          doctor_id: doctor.id,
          patient_id: patient_id || null,
          title: "New Conversation",
          status: "active",
          active_document_type: document_type || null,
          context: {},
          locale: conversationLocale,
        })
        .select()
        .single();

      if (convError) {
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 },
        );
      }
      conversation = newConv;
      conversationId = newConv.id;
    }

    // Build locale-aware system prompt
    const systemPrompt = buildHelenaSystemPrompt(conversationLocale);

    // Get patient info if patient_id provided
    let patientContext = "";
    if (patient_id) {
      const { data: patient } = await supabase
        .from("larinova_patients")
        .select("*")
        .eq("id", patient_id)
        .single();

      if (patient) {
        patientContext = `\n\nPatient Information:
- Name: ${patient.full_name}
- Date of Birth: ${patient.date_of_birth || "Unknown"}
- Gender: ${patient.gender || "Unknown"}
- Patient Code: ${patient.patient_code || "N/A"}
- Blood Type: ${patient.blood_type || "Unknown"}
- Allergies: ${patient.allergies || "None reported"}
- Chronic Conditions: ${patient.chronic_conditions || "None reported"}`;

        // Get recent consultations for this patient
        const { data: consultations } = await supabase
          .from("larinova_consultations")
          .select("*")
          .eq("patient_id", patient_id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (consultations && consultations.length > 0) {
          patientContext += "\n\nRecent Consultations:";
          consultations.forEach((c, i) => {
            patientContext += `\n${i + 1}. ${new Date(c.created_at!).toLocaleDateString()} - ${c.chief_complaint || "General consultation"}`;
            if (c.diagnosis) patientContext += ` | Diagnosis: ${c.diagnosis}`;
          });
        }
      }
    }

    // Get conversation history
    const { data: messageHistory } = await supabase
      .from("helena_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build conversation context for Claude
    const conversationContext =
      messageHistory
        ?.map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n") || "";

    // Build the full prompt using locale-aware system prompt
    let fullPrompt = systemPrompt;

    fullPrompt += `\n\nDoctor Information:
- Name: Dr. ${doctor.full_name}
- Specialization: ${doctor.specialization || "General Practice"}
- License Number: ${doctor.license_number || "N/A"}`;

    if (patientContext) {
      fullPrompt += patientContext;
    }

    if (document_type && generate_document) {
      const docInfo = DOCUMENT_TYPES[document_type];
      fullPrompt += `\n\n**IMPORTANT**: The doctor wants to generate a ${docInfo.label}. Please create a complete, professional ${docInfo.label} based on the context and the doctor's request.`;
    }

    if (conversationContext) {
      fullPrompt += `\n\nConversation History:\n${conversationContext}`;
    }

    fullPrompt += `\n\nCurrent User Message: ${message}`;

    // Save user message to database
    await supabase.from("helena_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
      metadata: { document_type, generate_document },
    });

    // Call Claude Service
    const claudeResponse = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        model: "sonnet",
        maxTurns: 1,
        workingDirectory: "/tmp",
      }),
    });

    if (!claudeResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get response from Helena" },
        { status: 500 },
      );
    }

    // Parse response from Claude service
    const responseText = await claudeResponse.text();
    const lines = responseText.split("\n").filter((line) => line.trim());

    let assistantResponse = "";
    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        // Handle assistant message with content array (non-streaming format)
        if (event.type === "claude_event" && event.data?.type === "assistant") {
          const content = event.data.message?.content;
          if (content && Array.isArray(content)) {
            for (const block of content) {
              if (block.type === "text") {
                assistantResponse += block.text;
              }
            }
          }
        }

        // Also handle streaming text_delta format (fallback)
        if (
          event.type === "claude_event" &&
          event.data?.type === "content_block_delta"
        ) {
          if (event.data.delta?.type === "text_delta") {
            assistantResponse += event.data.delta.text;
          }
        }
      } catch {
        continue;
      }
    }

    if (!assistantResponse.trim()) {
      return NextResponse.json(
        { error: "Failed to get response from Helena" },
        { status: 500 },
      );
    }

    // Parse response for document
    const {
      message: responseMessage,
      documentContent,
      documentTitle,
    } = parseDocumentFromResponse(assistantResponse);

    // Save document if generated
    let savedDocument = null;
    if (documentContent && documentTitle) {
      const { data: doc, error: docError } = await supabase
        .from("larinova_documents")
        .insert({
          doctor_id: doctor.id,
          patient_id: patient_id || null,
          conversation_id: conversationId,
          document_type: document_type || "general",
          title: documentTitle,
          content: documentContent,
          status: "draft",
          metadata: {
            generated_by: "helena",
            original_request: message,
            locale: conversationLocale,
          },
        })
        .select()
        .single();

      if (!docError) {
        savedDocument = doc;
      }
    }

    // Save assistant message to database
    await supabase.from("helena_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: responseMessage,
      document_id: savedDocument?.id || null,
      metadata: { has_document: !!savedDocument },
    });

    // Record AI usage
    await recordAIUsage(doctor.id, "helena_chat");

    // Update conversation title if it's a new conversation
    if (conversation.title === "New Conversation") {
      const title =
        message.length > 50 ? message.substring(0, 47) + "..." : message;
      await supabase
        .from("helena_conversations")
        .update({ title })
        .eq("id", conversationId);
    }

    return NextResponse.json({
      message: responseMessage,
      conversation_id: conversationId,
      document: savedDocument,
      locale: conversationLocale,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
