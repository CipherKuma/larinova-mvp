import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { locale } = await req.json();
  if (!["in", "id"].includes(locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, stored: false });

  await supabase
    .from("larinova_doctors")
    .update({ locale })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, stored: true });
}
