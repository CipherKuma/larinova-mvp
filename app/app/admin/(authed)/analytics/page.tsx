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

type DoctorRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  locale: string | null;
  specialization: string | null;
  onboarding_completed: boolean;
  invite_code_claimed_at: string | null;
  invite_code_redeemed_at: string | null;
  created_at: string;
};

type ConsultRow = { doctor_id: string; start_time: string };
type SubRow = { doctor_id: string; plan: string; status: string };

type DoctorHealth = {
  id: string;
  name: string;
  email: string;
  joined: string;
  state: "no_claim" | "claimed_only" | "onboarded_only" | "active" | "stalled";
  plan: string;
  consults_total: number;
  consults_7d: number;
  first_consult_at: string | null;
  last_consult_at: string | null;
  days_since_last: number | null;
};

function dayOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchData() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const now = Date.now();
  const since7d = new Date(now - 7 * 86_400_000).toISOString();
  const since1d = new Date(now - 86_400_000).toISOString();

  const [tsRes, clickRes, sessionsRes, doctorsRes, consultsRes, subsRes] =
    await Promise.all([
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
      sb
        .from("larinova_doctors")
        .select(
          "id, user_id, full_name, email, locale, specialization, onboarding_completed, invite_code_claimed_at, invite_code_redeemed_at, created_at",
        )
        .order("created_at", { ascending: false }),
      sb
        .from("larinova_consultations")
        .select("doctor_id, start_time")
        .order("start_time", { ascending: false })
        .limit(5000),
      sb.from("larinova_subscriptions").select("doctor_id, plan, status"),
    ]);

  // ---------- existing: timeseries ----------
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

  // ---------- existing: top clicks ----------
  const counts = new Map<string, number>();
  for (const r of clickRes.data ?? []) {
    counts.set(r.element!, (counts.get(r.element!) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  // ---------- existing: sessions ----------
  const sessionMap = new Map<string, SessionAgg>();
  for (const r of sessionsRes.data ?? []) {
    const cur = sessionMap.get(r.session_id);
    if (!cur) {
      sessionMap.set(r.session_id, {
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
  const sessions = [...sessionMap.values()]
    .sort((a, b) => b.last_ts.localeCompare(a.last_ts))
    .slice(0, 30);

  // ---------- new: per-doctor consult aggregations ----------
  const doctors = (doctorsRes.data ?? []) as DoctorRow[];
  const consults = (consultsRes.data ?? []) as ConsultRow[];
  const subs = (subsRes.data ?? []) as SubRow[];

  const subByDoctor = new Map<string, SubRow>();
  for (const s of subs) {
    const cur = subByDoctor.get(s.doctor_id);
    // Prefer active rows
    if (!cur || (s.status === "active" && cur.status !== "active")) {
      subByDoctor.set(s.doctor_id, s);
    }
  }

  const consultsByDoctor = new Map<
    string,
    { total: number; in7d: number; first: string | null; last: string | null }
  >();
  for (const c of consults) {
    const e = consultsByDoctor.get(c.doctor_id) ?? {
      total: 0,
      in7d: 0,
      first: null,
      last: null,
    };
    e.total += 1;
    if (c.start_time >= since7d) e.in7d += 1;
    if (!e.last || c.start_time > e.last) e.last = c.start_time;
    if (!e.first || c.start_time < e.first) e.first = c.start_time;
    consultsByDoctor.set(c.doctor_id, e);
  }

  const doctorHealth: DoctorHealth[] = doctors.map((d) => {
    const c = consultsByDoctor.get(d.id);
    const sub = subByDoctor.get(d.id);
    const consultsTotal = c?.total ?? 0;
    const lastIso = c?.last ?? null;
    const daysSinceLast = lastIso
      ? Math.floor((now - new Date(lastIso).getTime()) / 86_400_000)
      : null;

    let state: DoctorHealth["state"];
    if (consultsTotal > 0) {
      state =
        daysSinceLast !== null && daysSinceLast > 3 ? "stalled" : "active";
    } else if (d.onboarding_completed) {
      state = "onboarded_only";
    } else if (d.invite_code_claimed_at) {
      state = "claimed_only";
    } else {
      state = "no_claim";
    }

    return {
      id: d.id,
      name: d.full_name ?? d.email?.split("@")[0] ?? "Doctor",
      email: d.email ?? "—",
      joined: d.created_at,
      state,
      plan: sub?.plan ?? "free",
      consults_total: consultsTotal,
      consults_7d: c?.in7d ?? 0,
      first_consult_at: c?.first ?? null,
      last_consult_at: lastIso,
      days_since_last: daysSinceLast,
    };
  });

  // Sort: active doctors first (by recency), then onboarded_only, then claimed,
  // then no_claim. Inside each bucket sort by most recent activity / signup.
  const stateOrder: Record<DoctorHealth["state"], number> = {
    active: 0,
    stalled: 1,
    onboarded_only: 2,
    claimed_only: 3,
    no_claim: 4,
  };
  doctorHealth.sort((a, b) => {
    const so = stateOrder[a.state] - stateOrder[b.state];
    if (so !== 0) return so;
    const aTime = a.last_consult_at ?? a.joined;
    const bTime = b.last_consult_at ?? b.joined;
    return bTime.localeCompare(aTime);
  });

  // ---------- new: activation funnel ----------
  const codesRes = await sb
    .from("larinova_invite_codes")
    .select("claimed_at, consumed_at");
  const codes = codesRes.data ?? [];
  const codesIssued = codes.length;
  const codesClaimed = codes.filter((c) => c.claimed_at).length;
  const codesConsumed = codes.filter((c) => c.consumed_at).length;
  const drsWith1Plus = doctorHealth.filter((d) => d.consults_total >= 1).length;
  const drsWith2Plus = doctorHealth.filter((d) => d.consults_total >= 2).length;

  const funnel = [
    { label: "Codes issued", value: codesIssued, pct: 100 },
    {
      label: "Claimed",
      value: codesClaimed,
      pct: codesIssued ? Math.round((100 * codesClaimed) / codesIssued) : 0,
    },
    {
      label: "Onboarded",
      value: codesConsumed,
      pct: codesIssued ? Math.round((100 * codesConsumed) / codesIssued) : 0,
    },
    {
      label: "First consult",
      value: drsWith1Plus,
      pct: codesIssued ? Math.round((100 * drsWith1Plus) / codesIssued) : 0,
    },
    {
      label: "Retained (≥2)",
      value: drsWith2Plus,
      pct: codesIssued ? Math.round((100 * drsWith2Plus) / codesIssued) : 0,
    },
  ];

  // ---------- new: needs-attention list ----------
  const oneDayAgoTs = now - 86_400_000;
  const threeDaysAgoTs = now - 3 * 86_400_000;
  const needsAttention: { doctor: DoctorHealth; reason: string }[] = [];
  for (const d of doctorHealth) {
    if (d.state === "claimed_only") {
      const claimed = doctors.find(
        (x) => x.id === d.id,
      )?.invite_code_claimed_at;
      if (claimed && new Date(claimed).getTime() < oneDayAgoTs) {
        needsAttention.push({
          doctor: d,
          reason: "Claimed >24h ago, never onboarded",
        });
      }
    } else if (d.state === "onboarded_only") {
      const consumed = doctors.find(
        (x) => x.id === d.id,
      )?.invite_code_redeemed_at;
      if (consumed && new Date(consumed).getTime() < oneDayAgoTs) {
        needsAttention.push({
          doctor: d,
          reason: "Onboarded >24h ago, no consult yet",
        });
      }
    } else if (d.state === "stalled") {
      needsAttention.push({
        doctor: d,
        reason: `Last consult ${d.days_since_last}d ago`,
      });
    }
  }

  return {
    series,
    top,
    sessions,
    doctorHealth,
    funnel,
    needsAttention,
    totals: {
      doctors: doctors.length,
      active: doctorHealth.filter((d) => d.state === "active").length,
    },
  };
}

function StateBadge({ state }: { state: DoctorHealth["state"] }) {
  const map: Record<DoctorHealth["state"], { label: string; cls: string }> = {
    active: {
      label: "Active",
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    stalled: {
      label: "Stalled",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    onboarded_only: {
      label: "Onboarded",
      cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    claimed_only: {
      label: "Claimed",
      cls: "bg-muted/40 text-muted-foreground border-border",
    },
    no_claim: {
      label: "No claim",
      cls: "bg-muted/30 text-muted-foreground border-border",
    },
  };
  const m = map[state];
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default async function AnalyticsPage() {
  const {
    series,
    top,
    sessions,
    doctorHealth,
    funnel,
    needsAttention,
    totals,
  } = await fetchData();

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-xs text-muted-foreground">
          {totals.doctors} doctor{totals.doctors !== 1 ? "s" : ""} ·{" "}
          {totals.active} active
        </p>
      </div>

      {/* ───────── 1. Activation funnel ───────── */}
      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Activation funnel
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="space-y-3">
            {funnel.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-sm">{step.label}</div>
                <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right tabular-nums text-sm">
                  <span className="font-semibold">{step.value}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {step.pct}%
                  </span>
                </div>
                {i < funnel.length - 1 && funnel[i + 1].value < step.value && (
                  <div className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                    −{step.value - funnel[i + 1].value}
                  </div>
                )}
                {(i === funnel.length - 1 ||
                  funnel[i + 1].value >= step.value) && (
                  <div className="w-12 shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Code issued → Claimed (entered code) → Onboarded (completed
            onboarding) → First consult → Retained (≥2 consults).
          </p>
        </div>
      </section>

      {/* ───────── 2. Needs attention ───────── */}
      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Needs attention
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {needsAttention.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nobody&apos;s stuck — every active doctor was seen within the last
              3 days.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Doctor</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {needsAttention.map(({ doctor, reason }) => (
                  <tr
                    key={doctor.id}
                    className="border-t border-border hover:bg-muted/20"
                  >
                    <td className="px-4 py-2 font-medium">
                      <Link
                        href={`/admin/doctors/${doctor.id}`}
                        className="hover:underline"
                      >
                        {doctor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {doctor.email}
                    </td>
                    <td className="px-4 py-2 text-amber-400/90">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ───────── 3. Doctor health ───────── */}
      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Doctor health
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Doctor</th>
                <th className="px-4 py-2 font-medium">State</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Joined</th>
                <th className="px-4 py-2 font-medium">First consult</th>
                <th className="px-4 py-2 font-medium">Last consult</th>
                <th className="px-4 py-2 font-medium text-right">7d</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {doctorHealth.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border hover:bg-muted/20"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/doctors/${d.id}`}
                      className="hover:underline font-medium"
                    >
                      {d.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {d.email}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <StateBadge state={d.state} />
                  </td>
                  <td className="px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {d.plan}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {fmtDate(d.joined)}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {fmtDate(d.first_consult_at)}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {d.last_consult_at ? (
                      <>
                        {fmtDate(d.last_consult_at)}
                        <span className="text-xs ml-1">
                          ({d.days_since_last}d)
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.consults_7d}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">
                    {d.consults_total}
                  </td>
                </tr>
              ))}
              {doctorHealth.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No doctors yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────── existing: event flux (de-emphasized below) ───────── */}
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
                      href={`/admin/analytics/sessions/${s.session_id}`}
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
