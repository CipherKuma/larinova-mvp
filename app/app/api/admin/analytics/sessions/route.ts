import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const { data } = await sb
    .from("larinova_events")
    .select("session_id, ts, user_id, path")
    .gte("ts", since)
    .order("ts", { ascending: false })
    .limit(5000);

  const map = new Map<
    string,
    {
      session_id: string;
      user_id: string | null;
      first_ts: string;
      last_ts: string;
      events: number;
      last_path: string | null;
    }
  >();
  for (const r of data ?? []) {
    const cur = map.get(r.session_id);
    if (!cur) {
      map.set(r.session_id, {
        session_id: r.session_id,
        user_id: r.user_id,
        first_ts: r.ts,
        last_ts: r.ts,
        events: 1,
        last_path: r.path,
      });
    } else {
      cur.events += 1;
      if (r.ts > cur.last_ts) {
        cur.last_ts = r.ts;
        cur.last_path = r.path;
      }
      if (r.ts < cur.first_ts) cur.first_ts = r.ts;
      if (!cur.user_id && r.user_id) cur.user_id = r.user_id;
    }
  }
  const sessions = [...map.values()]
    .sort((a, b) => b.last_ts.localeCompare(a.last_ts))
    .slice(0, 100);
  return NextResponse.json({ sessions });
}
