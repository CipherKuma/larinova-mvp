import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor)
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const { handle } = (await req.json()) as { handle: string };
  if (!handle || !/^[a-z0-9-]{3,40}$/.test(handle)) {
    return NextResponse.json(
      {
        error:
          "Invalid handle. Use 3–40 lowercase letters, numbers, or hyphens.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("larinova_doctors")
    .select("id")
    .eq("booking_handle", handle)
    .neq("id", doctor.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Handle already taken", available: false },
      { status: 409 },
    );
  }

  await admin
    .from("larinova_doctors")
    .update({ booking_handle: handle })
    .eq("id", doctor.id);
  return NextResponse.json({ success: true, handle, available: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor)
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle || !/^[a-z0-9-]{3,40}$/.test(handle)) {
    return NextResponse.json({
      available: false,
      error: "Invalid handle format",
    });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("larinova_doctors")
    .select("id")
    .eq("booking_handle", handle)
    .neq("id", doctor.id)
    .maybeSingle();

  return NextResponse.json({ available: !existing });
}
