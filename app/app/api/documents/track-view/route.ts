import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { document_type, document_id, patient_id } = body;

    if (!document_type || !document_id) {
      return NextResponse.json(
        { error: "document_type and document_id are required" },
        { status: 400 },
      );
    }

    // Insert or update document view
    const { error } = await supabase.from("larinova_document_views").insert({
      user_id: user.id,
      document_type,
      document_id,
      patient_id,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
