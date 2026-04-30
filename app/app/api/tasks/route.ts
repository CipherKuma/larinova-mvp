import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let query = supabase
      .from("larinova_tasks")
      .select(
        `
        *,
        patient:larinova_patients!larinova_tasks_patient_id_fkey(
          id,
          full_name,
          patient_code
        ),
        consultation:larinova_consultations!larinova_tasks_consultation_id_fkey(
          id,
          consultation_code
        ),
        assigned_user:larinova_doctors!larinova_tasks_assigned_to_fkey(
          id,
          full_name,
          email
        )
      `,
      )
      .eq("assigned_to", doctor.id);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    // Get doctor info
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      priority,
      due_date,
      patient_id,
      consultation_id,
      assigned_to,
    } = body;

    const { data, error } = await supabase
      .from("larinova_tasks")
      .insert({
        title,
        description,
        type,
        priority: priority || "medium",
        due_date,
        patient_id,
        consultation_id,
        assigned_to: assigned_to || doctor.id,
        created_by: doctor.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // If status is changing to completed, set completed_at
    if (updates.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("larinova_tasks")
      .update(updates)
      .eq("id", id)
      .eq("assigned_to", doctor.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("larinova_tasks")
      .delete()
      .eq("id", id)
      .eq("created_by", doctor.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
