import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("larinova_invite_codes")
    .select("code, note, created_at, redeemed_by, redeemed_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data ?? [] });
}
