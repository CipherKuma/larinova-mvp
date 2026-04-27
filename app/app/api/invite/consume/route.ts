import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("consume_invite_code");

  if (error) {
    const msg = error.message ?? "";
    let code: "no_active_claim" | "unauthenticated" | "unknown" = "unknown";
    if (msg.includes("no_active_claim")) code = "no_active_claim";
    else if (msg.includes("unauthenticated")) code = "unauthenticated";
    const status = code === "unauthenticated" ? 401 : 400;
    return NextResponse.json({ error: code }, { status });
  }

  return NextResponse.json({
    ok: true,
    period_end: data?.period_end ?? null,
    already_consumed: Boolean(data?.already_consumed),
  });
}
