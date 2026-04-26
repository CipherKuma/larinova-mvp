import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const url = new URL(req.url);
  const days = Math.min(
    90,
    Math.max(1, parseInt(url.searchParams.get("days") ?? "7")),
  );
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data } = await sb
    .from("larinova_events")
    .select("element")
    .eq("event_type", "click")
    .gte("ts", since)
    .not("element", "is", null);

  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    counts.set(r.element!, (counts.get(r.element!) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  return NextResponse.json({
    top: top.map(([element, count]) => ({ element, count })),
  });
}
