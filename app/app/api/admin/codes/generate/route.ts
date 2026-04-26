import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

const Body = z.object({
  count: z.number().int().min(1).max(50),
  note: z.string().trim().max(120).optional(),
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
  const inserted: string[] = [];

  for (let i = 0; i < body.count; i++) {
    let attempts = 0;
    while (attempts < 5) {
      const code = genCode();
      const { error } = await supabase
        .from("larinova_invite_codes")
        .insert({ code, note: body.note ?? null });
      if (!error) {
        inserted.push(code);
        break;
      }
      if (!error.message.includes("duplicate")) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      attempts++;
    }
  }

  return NextResponse.json({ codes: inserted });
}
