import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";
import { sendAlphaWelcomeEmail } from "@/lib/resend/email";

const Body = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(200),
});

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function genCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `LARINOVA-${s}`;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Service-role client — RLS on larinova_invite_codes blocks inserts
  // via the user JWT. Admin gate above (requireAdmin) is the actual
  // authorization check; this client is only used for the privileged
  // insert that follows.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const note = `Dr. ${body.firstName} ${body.lastName} <${body.email}>`;

  // Insert a unique code, retry on collision. We write the structured
  // recipient columns (first_name/last_name/email) so the sign-up form
  // can pre-fill them; `note` stays for human-readable admin context.
  let code: string | null = null;
  for (let attempts = 0; attempts < 5; attempts++) {
    const candidate = genCode();
    const { error } = await supabase.from("larinova_invite_codes").insert({
      code: candidate,
      note,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
    });
    if (!error) {
      code = candidate;
      break;
    }
    if (!error.message.includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: "code_generation_failed" },
      { status: 500 },
    );
  }

  // Send the invite email. Delivery is best-effort for now: if email fails the
  // invite stays in the Doctors table, where admin can copy the code if needed.
  const sent = await sendAlphaWelcomeEmail({
    to: body.email,
    fullName: `${body.firstName} ${body.lastName}`,
    code,
  });

  return NextResponse.json({
    ok: true,
    code,
    sentTo: body.email,
    emailDelivered: sent,
  });
}
