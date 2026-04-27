import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const note = `Dr. ${body.firstName} ${body.lastName} <${body.email}>`;

  // Insert a unique code, retry on collision
  let code: string | null = null;
  for (let attempts = 0; attempts < 5; attempts++) {
    const candidate = genCode();
    const { error } = await supabase
      .from("larinova_invite_codes")
      .insert({ code: candidate, note });
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

  // Send the invite email. RPC is best-effort for now: if email fails the
  // code stays in the table (admin can copy from /admin/codes and resend).
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
