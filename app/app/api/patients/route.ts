import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getCurrentDoctor() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, error: "Unauthorized" as const, status: 401 as const };
  }

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctor) {
    return { supabase, error: "Doctor not found" as const, status: 404 as const };
  }

  return { supabase, doctor };
}

export async function GET(request: Request) {
  try {
    const auth = await getCurrentDoctor();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "500");

    const { data, error } = await auth.supabase
      .from("larinova_patients")
      .select("id, patient_code, full_name, email, date_of_birth, blood_group, phone, gender")
      .eq("created_by_doctor_id", auth.doctor.id)
      .order("full_name")
      .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 500);

    if (error) throw error;

    return NextResponse.json({ patients: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getCurrentDoctor();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { full_name, email, phone, gender, blood_group, address, date_of_birth } =
      body;

    if (!full_name || !email || !gender || !date_of_birth) {
      return NextResponse.json(
        { error: "Missing required patient fields" },
        { status: 400 },
      );
    }

    const { data, error } = await auth.supabase
      .from("larinova_patients")
      .insert({
        full_name,
        email,
        phone,
        gender,
        blood_group,
        address,
        date_of_birth,
        created_by_doctor_id: auth.doctor.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ patient: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
