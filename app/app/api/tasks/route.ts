import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isRecentDuplicateTask,
  normalizeTaskFingerprint,
} from "@/lib/tasks/idempotency";

const TASK_TYPES = [
  "follow_up",
  "prescription_review",
  "record_completion",
  "general",
] as const;
const TASK_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;

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
      status,
      priority,
      due_date,
      patient_id,
      consultation_id,
      assigned_to,
    } = body;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Task title required" },
        { status: 400 },
      );
    }
    if (!TASK_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
    }
    if (priority && !TASK_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    if (body.status && !TASK_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const taskFingerprint = normalizeTaskFingerprint({
      title,
      description: description ?? null,
      type,
      status: status || "pending",
      priority: priority || "medium",
      due_date: due_date ?? null,
      patient_id: patient_id ?? null,
      consultation_id: consultation_id ?? null,
      assigned_to: assigned_to || doctor.id,
      created_by: doctor.id,
    });

    let duplicateQuery = supabase
      .from("larinova_tasks")
      .select(
        "id, title, description, type, status, priority, due_date, patient_id, consultation_id, assigned_to, created_by, created_at",
      )
      .eq("assigned_to", taskFingerprint.assigned_to)
      .eq("created_by", taskFingerprint.created_by)
      .eq("title", taskFingerprint.title)
      .eq("type", taskFingerprint.type)
      .eq("status", taskFingerprint.status)
      .eq("priority", taskFingerprint.priority)
      .gte("created_at", new Date(Date.now() - 30_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    duplicateQuery = taskFingerprint.description
      ? duplicateQuery.eq("description", taskFingerprint.description)
      : duplicateQuery.is("description", null);
    duplicateQuery = taskFingerprint.due_date
      ? duplicateQuery.eq("due_date", taskFingerprint.due_date)
      : duplicateQuery.is("due_date", null);
    duplicateQuery = taskFingerprint.patient_id
      ? duplicateQuery.eq("patient_id", taskFingerprint.patient_id)
      : duplicateQuery.is("patient_id", null);
    duplicateQuery = taskFingerprint.consultation_id
      ? duplicateQuery.eq("consultation_id", taskFingerprint.consultation_id)
      : duplicateQuery.is("consultation_id", null);

    const { data: recentTasks, error: duplicateError } = await duplicateQuery;
    if (duplicateError) throw duplicateError;

    const duplicateTask = recentTasks?.find((task) =>
      isRecentDuplicateTask(task, taskFingerprint),
    );

    if (duplicateTask) {
      return NextResponse.json({ task: duplicateTask, duplicate: true });
    }

    const { data, error } = await supabase
      .from("larinova_tasks")
      .insert({
        ...taskFingerprint,
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
