import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SessionAgg = {
  session_id: string;
  user_id: string | null;
  first_ts: string;
  last_ts: string;
  events: number;
  last_path: string | null;
};

async function fetchData() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const since1d = new Date(Date.now() - 86_400_000).toISOString();

  const [tsRes, clickRes, sessionsRes] = await Promise.all([
    sb.from("larinova_events").select("ts, event_type").gte("ts", since7d),
    sb
      .from("larinova_events")
      .select("element")
      .eq("event_type", "click")
      .gte("ts", since7d)
      .not("element", "is", null),
    sb
      .from("larinova_events")
      .select("session_id, ts, user_id, path")
      .gte("ts", since1d)
      .order("ts", { ascending: false })
      .limit(5000),
  ]);

  // timeseries
  const buckets = new Map<
    string,
    { pageviews: number; clicks: number; milestones: number }
  >();
  for (const r of tsRes.data ?? []) {
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

  // top clicks
  const counts = new Map<string, number>();
  for (const r of clickRes.data ?? []) {
    counts.set(r.element!, (counts.get(r.element!) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  // sessions
  const map = new Map<string, SessionAgg>();
  for (const r of sessionsRes.data ?? []) {
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
    .slice(0, 30);

  return { series, top, sessions };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { series, top, sessions } = await fetchData();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Last 7 days
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium text-right">Pageviews</th>
                <th className="px-4 py-2 font-medium text-right">Clicks</th>
                <th className="px-4 py-2 font-medium text-right">Milestones</th>
              </tr>
            </thead>
            <tbody>
              {series.map((d) => (
                <tr key={d.day} className="border-t border-border">
                  <td className="px-4 py-2 font-mono">{d.day}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.pageviews}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.clicks}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.milestones}
                  </td>
                </tr>
              ))}
              {series.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Top clicked (7d)
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {top.map(([element, count]) => (
                <tr
                  key={element}
                  className="border-t border-border first:border-0"
                >
                  <td className="px-4 py-2 font-mono">{element}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{count}</td>
                </tr>
              ))}
              {top.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground">
                    No clicks tracked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Recent sessions (24h)
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Session</th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Last path</th>
                <th className="px-4 py-2 font-medium text-right">Events</th>
                <th className="px-4 py-2 font-medium text-right">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-2 font-mono">
                    <Link
                      href={`/${locale}/admin/analytics/sessions/${s.session_id}`}
                      className="hover:underline"
                    >
                      {s.session_id.slice(0, 12)}…
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {s.user_id ? s.user_id.slice(0, 8) + "…" : "anon"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {s.last_path ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {s.events}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {new Date(s.last_ts).toLocaleString()}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No sessions in last 24h.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
