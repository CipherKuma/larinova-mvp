import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const COOKIE_NAME = "larinova_invite_token";

export async function POST() {
  const cookieStore = await cookies();
  const code = cookieStore.get(COOKIE_NAME)?.value;
  if (!code) {
    return NextResponse.json({ error: "no_invite_token" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("claim_invite_code", {
    p_code: code.toUpperCase(),
  });

  if (error) {
    const msg = error.message ?? "";
    const status = msg.includes("unauthenticated") ? 401 : 400;
    const code = msg.includes("invalid_or_used_code")
      ? "invalid_or_used_code"
      : msg.includes("unauthenticated")
        ? "unauthenticated"
        : "unknown";
    return NextResponse.json({ error: code }, { status });
  }

  // Best-effort: clear the cookie so it's not lying around — the doctor row
  // is now the source of truth for the claim state.
  const res = NextResponse.json({
    ok: true,
    already_claimed: Boolean(data?.already_claimed),
  });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
