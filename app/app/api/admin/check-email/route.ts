import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";

const Body = z.object({ email: z.string().trim().email() });

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  if (!isAdminEmail(parsed.email)) {
    return NextResponse.json({ error: "not_admin" }, { status: 403 });
  }
  const email = parsed.email.toLowerCase();

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: list, error } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  const found = list.users.find(
    (u) => u.email?.toLowerCase() === email,
  );
  if (!found) {
    const { error: createError } = await sb.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (createError) {
      return NextResponse.json(
        { error: "admin_user_create_failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ hasPassword: false });
  }

  // Auth users created via password sign-up have an "encrypted_password"
  // backing — but the admin SDK doesn't surface it. Use last_sign_in_at +
  // identities providers as a heuristic. If the user has an email/password
  // identity, treat as has-password.
  const hasPassword = Boolean(
    found?.identities?.some((i) => i.provider === "email"),
  );
  return NextResponse.json({ hasPassword: Boolean(found) && hasPassword });
}
