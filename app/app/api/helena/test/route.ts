import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLAUDE_SERVICE_URL = process.env.CLAUDE_SERVICE_URL || "";
const CLAUDE_API_KEY = process.env.CLAUDE_SERVICE_API_KEY || "";

export async function GET(req: Request) {
  const results: {
    step: string;
    status: "pass" | "fail" | "skip";
    message: string;
    data?: unknown;
  }[] = [];

  try {
    const supabase = await createClient();

    // Step 1: Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated. Please sign in first.",
          results: [
            {
              step: "Authentication",
              status: "fail",
              message: "User not authenticated",
            },
          ],
        },
        { status: 401 },
      );
    }
    results.push({
      step: "Authentication",
      status: "pass",
      message: `Authenticated as ${user.email}`,
    });

    // Step 2: Get doctor profile
    const { data: doctor, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (doctorError || !doctor) {
      results.push({
        step: "Doctor Profile",
        status: "fail",
        message: "Doctor profile not found",
      });
      return NextResponse.json({ success: false, results });
    }
    results.push({
      step: "Doctor Profile",
      status: "pass",
      message: `Found doctor: Dr. ${doctor.full_name}`,
      data: { doctor_id: doctor.id },
    });

    // Step 3: Check tables exist
    const { error: convTableError } = await supabase
      .from("helena_conversations")
      .select("id")
      .limit(1);

    results.push({
      step: "Table: helena_conversations",
      status: convTableError ? "fail" : "pass",
      message: convTableError ? convTableError.message : "Table accessible",
    });

    const { error: msgTableError } = await supabase
      .from("helena_messages")
      .select("id")
      .limit(1);

    results.push({
      step: "Table: helena_messages",
      status: msgTableError ? "fail" : "pass",
      message: msgTableError ? msgTableError.message : "Table accessible",
    });

    const { error: docTableError } = await supabase
      .from("larinova_documents")
      .select("id")
      .limit(1);

    results.push({
      step: "Table: larinova_documents",
      status: docTableError ? "fail" : "pass",
      message: docTableError ? docTableError.message : "Table accessible",
    });

    // Step 4: Create a test conversation
    const { data: conversation, error: convCreateError } = await supabase
      .from("helena_conversations")
      .insert({
        doctor_id: doctor.id,
        title: "Test Conversation",
        status: "active",
        context: { test: true },
      })
      .select()
      .single();

    if (convCreateError) {
      results.push({
        step: "Create Conversation",
        status: "fail",
        message: convCreateError.message,
      });
      return NextResponse.json({ success: false, results });
    }
    results.push({
      step: "Create Conversation",
      status: "pass",
      message: `Created conversation: ${conversation.id}`,
      data: { conversation_id: conversation.id },
    });

    // Step 5: Add a user message
    const { data: userMsg, error: userMsgError } = await supabase
      .from("helena_messages")
      .insert({
        conversation_id: conversation.id,
        role: "user",
        content: "Test message: Can you write a referral letter?",
        metadata: { test: true },
      })
      .select()
      .single();

    if (userMsgError) {
      results.push({
        step: "Create User Message",
        status: "fail",
        message: userMsgError.message,
      });
    } else {
      results.push({
        step: "Create User Message",
        status: "pass",
        message: `Created message: ${userMsg.id}`,
      });
    }

    // Step 6: Add an assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from("helena_messages")
      .insert({
        conversation_id: conversation.id,
        role: "assistant",
        content:
          "I can help you write a referral letter. What information do you need to include?",
        metadata: { test: true },
      })
      .select()
      .single();

    if (assistantMsgError) {
      results.push({
        step: "Create Assistant Message",
        status: "fail",
        message: assistantMsgError.message,
      });
    } else {
      results.push({
        step: "Create Assistant Message",
        status: "pass",
        message: `Created message: ${assistantMsg.id}`,
      });
    }

    // Step 7: Create a test document
    const { data: document, error: docCreateError } = await supabase
      .from("larinova_documents")
      .insert({
        doctor_id: doctor.id,
        conversation_id: conversation.id,
        document_type: "referral_letter",
        title: "Test Referral Letter",
        content:
          "This is a test referral letter content.\n\nDear Dr. Specialist,\n\nI am referring this patient for evaluation...",
        status: "draft",
        metadata: { test: true, generated_by: "helena-test" },
      })
      .select()
      .single();

    if (docCreateError) {
      results.push({
        step: "Create Document",
        status: "fail",
        message: docCreateError.message,
      });
    } else {
      results.push({
        step: "Create Document",
        status: "pass",
        message: `Created document: ${document.title}`,
        data: { document_id: document.id },
      });
    }

    // Step 8: Fetch the conversation with messages
    const { data: fetchedConv, error: fetchConvError } = await supabase
      .from("helena_conversations")
      .select("*")
      .eq("id", conversation.id)
      .single();

    results.push({
      step: "Fetch Conversation",
      status: fetchConvError ? "fail" : "pass",
      message: fetchConvError
        ? fetchConvError.message
        : `Fetched: ${fetchedConv?.title}`,
    });

    // Step 9: Fetch messages for conversation
    const { data: messages, error: fetchMsgError } = await supabase
      .from("helena_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    results.push({
      step: "Fetch Messages",
      status: fetchMsgError ? "fail" : "pass",
      message: fetchMsgError
        ? fetchMsgError.message
        : `Found ${messages?.length || 0} messages`,
      data: {
        messages: messages?.map((m) => ({
          role: m.role,
          content: m.content.substring(0, 50) + "...",
        })),
      },
    });

    // Step 10: Fetch documents
    const { data: docs, error: fetchDocsError } = await supabase
      .from("larinova_documents")
      .select("*")
      .eq("doctor_id", doctor.id)
      .order("created_at", { ascending: false })
      .limit(5);

    results.push({
      step: "Fetch Documents",
      status: fetchDocsError ? "fail" : "pass",
      message: fetchDocsError
        ? fetchDocsError.message
        : `Found ${docs?.length || 0} documents`,
      data: {
        documents: docs?.map((d) => ({
          id: d.id,
          title: d.title,
          type: d.document_type,
        })),
      },
    });

    // Step 11: Test Claude service connection (if configured)
    if (CLAUDE_SERVICE_URL && CLAUDE_API_KEY) {
      try {
        const healthCheck = await fetch(`${CLAUDE_SERVICE_URL}/health`, {
          method: "GET",
          headers: { "X-API-Key": CLAUDE_API_KEY },
        });
        results.push({
          step: "Claude Service",
          status: healthCheck.ok ? "pass" : "fail",
          message: healthCheck.ok
            ? "Claude service is reachable"
            : `Status: ${healthCheck.status}`,
        });
      } catch (e) {
        results.push({
          step: "Claude Service",
          status: "fail",
          message: `Connection error: ${(e as Error).message}`,
        });
      }
    } else {
      results.push({
        step: "Claude Service",
        status: "skip",
        message: "CLAUDE_SERVICE_URL or CLAUDE_SERVICE_API_KEY not configured",
      });
    }

    // Summary
    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    const skipped = results.filter((r) => r.status === "skip").length;

    return NextResponse.json({
      success: failed === 0,
      summary: `${passed} passed, ${failed} failed, ${skipped} skipped`,
      results,
      testData: {
        conversation_id: conversation?.id,
        document_id: document?.id,
      },
    });
  } catch (error) {
    results.push({
      step: "Unexpected Error",
      status: "fail",
      message: (error as Error).message,
    });
    return NextResponse.json({ success: false, results }, { status: 500 });
  }
}
