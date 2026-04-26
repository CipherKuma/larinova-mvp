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

  const { data, error } = await sb
    .from("larinova_events")
    .select("ts, event_type")
    .gte("ts", since);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const buckets = new Map<
    string,
    { pageviews: number; clicks: number; milestones: number }
  >();
  for (const r of data ?? []) {
    const day = new Date(r.ts).toISOString().slice(0, 10);
    const b = buckets.get(day) ?? { pageviews: 0, clicks: 0, milestones: 0 };
    if (r.event_type === "pageview") b.pageviews++;
    else if (r.event_type === "click") b.clicks++;
    else if (r.event_type === "milestone") b.milestones++;
    buckets.set(day, b);
  }
  const series = [...buckets.entries()]
    .sort()
    .map(([day, v]) => ({ day, ...v }));
  return NextResponse.json({ days, series });
}
