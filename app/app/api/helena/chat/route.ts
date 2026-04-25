import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  HelenaChatRequest,
  DocumentType,
  DOCUMENT_TYPES,
} from "@/types/helena";
import { checkAIUsage, recordAIUsage } from "@/lib/subscription";
import { buildHelenaSystemPrompt } from "@/lib/helena/prompts";
import { sarvamChat, type SarvamMessage } from "@/lib/helena/sarvam";
import type { Locale } from "@/src/i18n/routing";

// Vercel function timeout. Sarvam typically responds in 1-6s, but allow
// headroom for long document drafts.
export const maxDuration = 30;

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
      locale: requestLocale,
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
    // For NEW conversations, the URL the user is on right now wins over the
    // doctor row's stored locale — a doctor browsing /in/ wants English even
    // if their account was created with locale='id'.
    let conversationLocale: Locale =
      (requestLocale as Locale) ?? (doctor.locale as Locale) ?? "in";

    if (conversationId) {
      const { data: existingConv } = await supabase
        .from("helena_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      conversation = existingConv;

      // Existing conversation's stored locale wins — don't switch languages mid-thread.
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
        console.error("[helena/chat] conv insert error:", convError);
        return NextResponse.json(
          {
            error: "Failed to create conversation",
            details: convError.message,
          },
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

    // Augment system prompt with doctor + (optional) patient context. This
    // keeps the LLM's `system` role focused on persona and constraints while
    // facts about the current session live alongside it.
    let augmentedSystem = systemPrompt;
    augmentedSystem += `\n\nDoctor Information:
- Name: Dr. ${doctor.full_name}
- Specialization: ${doctor.specialization || "General Practice"}
- License Number: ${doctor.license_number || "N/A"}`;
    if (patientContext) {
      augmentedSystem += patientContext;
    }
    if (document_type && generate_document) {
      const docInfo = DOCUMENT_TYPES[document_type];
      augmentedSystem += `\n\n**IMPORTANT**: The doctor wants to generate a ${docInfo.label}. Please create a complete, professional ${docInfo.label} based on the context and the doctor's request.`;
    }

    // Save user message to database (before LLM call so it's recorded even
    // if inference fails).
    await supabase.from("helena_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
      metadata: { document_type, generate_document },
    });

    // Build chat-completion message array. messageHistory was just fetched
    // above and does NOT include the user message we just inserted, so we
    // append it explicitly at the end.
    const chatMessages: SarvamMessage[] = [
      { role: "system", content: augmentedSystem },
    ];
    for (const m of messageHistory ?? []) {
      if (m.role === "user" || m.role === "assistant") {
        chatMessages.push({ role: m.role, content: m.content });
      }
    }
    chatMessages.push({ role: "user", content: message });

    let assistantResponse: string;
    const sarvamStart = Date.now();
    try {
      const result = await sarvamChat({
        messages: chatMessages,
        model: "sarvam-m",
        maxTokens: 2000,
        reasoningEffort: "low",
      });
      assistantResponse = result.text;
      console.log(
        "[helena/chat] sarvam ok",
        `${Date.now() - sarvamStart}ms`,
        `prompt=${result.promptTokens}`,
        `completion=${result.completionTokens}`,
        `finish=${result.finishReason}`,
      );
    } catch (e) {
      console.error("[helena/chat] sarvam error:", e);
      return NextResponse.json(
        { error: "Failed to get response from Helena" },
        { status: 502 },
      );
    }

    if (!assistantResponse.trim()) {
      console.error(
        "[helena/chat] empty Sarvam response after stripping reasoning",
      );
      return NextResponse.json(
        { error: "Empty response from Helena" },
        { status: 502 },
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
  } catch (e) {
    console.error("[helena/chat] unhandled error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
