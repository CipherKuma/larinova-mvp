import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const Body = z.object({
  code: z.string().trim().min(6).max(40),
});

const COOKIE_NAME = "larinova_invite_token";
const COOKIE_MAX_AGE = 60 * 60 * 6; // 6 hours — long enough to receive OTP and sign in

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const code = parsed.code.toUpperCase();

  // Use service role so we don't require an authed Supabase session at this
  // pre-auth gate. validate_invite_code is read-only and granted to anon, so
  // anon would also work; service role is just consistent with the rest of
  // our backend RPC calls.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase.rpc("validate_invite_code", {
    p_code: code,
  });

  if (error) {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }

  if (!data?.ok) {
    return NextResponse.json(
      { error: "invalid_or_used_code" },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, code, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
