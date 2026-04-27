"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import SubmissionsTable from "./SubmissionsTable";
import type { SurveyRow } from "./types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function freq(
  rows: SurveyRow[],
  get: (r: SurveyRow) => string[],
): { name: string; count: number }[] {
  const m: Record<string, number> = {};
  rows.forEach((r) =>
    get(r).forEach((v) => {
      if (v) m[v] = (m[v] || 0) + 1;
    }),
  );
  return Object.entries(m)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function single(
  rows: SurveyRow[],
  get: (r: SurveyRow) => string | null,
): { name: string; count: number }[] {
  const m: Record<string, number> = {};
  rows.forEach((r) => {
    const v = get(r);
    if (v) m[v] = (m[v] || 0) + 1;
  });
  return Object.entries(m)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function isToday(iso: string) {
  const d = new Date(iso),
    n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}
function isThisWeek(iso: string) {
  return new Date(iso) >= new Date(Date.now() - 7 * 86_400_000);
}

// Chart palette pulls from the theme via CSS variables. Recharts can't read
// CSS vars directly, so we use the resolved hex equivalents that match
// the dark theme token values.
const PRIMARY = "#10b981"; // primary (emerald)
const ACCENT_BLUE = "#3b82f6";
const ACCENT_TEAL = "#0d9488";

// ─── tooltip — themed ────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground mb-0.5 max-w-[180px] truncate">
        {payload[0].payload.name}
      </p>
      <p className="font-mono text-primary font-semibold">
        {payload[0].value} response{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

function HorizBar({
  data,
  color = PRIMARY,
  maxItems = 10,
}: {
  data: { name: string; count: number }[];
  color?: string;
  maxItems?: number;
}) {
  const rows = data.slice(0, maxItems);
  if (!rows.length)
    return (
      <p className="text-center text-xs text-muted-foreground py-8">
        No data yet
      </p>
    );
  const h = Math.max(rows.length * 38 + 30, 80);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        layout="vertical"
        data={rows}
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fill: "currentColor", fontSize: 10 }}
          className="text-muted-foreground/60"
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tick={{ fill: "currentColor", fontSize: 11 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) =>
            v.length > 28 ? v.slice(0, 28) + "…" : v
          }
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {rows.map((_, i) => (
            <Cell
              key={i}
              fill={color}
              fillOpacity={Math.max(0.45, 1 - i * 0.06)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground/80 mb-3">
      {children}
    </h2>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard({
  responses,
}: {
  responses: SurveyRow[];
}) {
  const total = responses.length;
  const today = responses.filter((r) => isToday(r.created_at)).length;
  const thisWeek = responses.filter((r) => isThisWeek(r.created_at)).length;
  const india = responses.filter((r) => r.locale === "en").length;
  const indonesia = responses.filter((r) => r.locale === "id").length;

  const problemsData = freq(responses, (r) => r.problems ?? []);
  const prioritiesData = freq(responses, (r) => r.priorities ?? []);
  const specData = single(responses, (r) => r.specialization);
  const cityData = single(responses, (r) => r.city).slice(0, 10);
  const patientsData = single(responses, (r) => r.patients_per_day);
  const paperworkData = single(responses, (r) => r.paperwork_time);
  const storageData = freq(responses, (r) =>
    [...(r.data_storage ?? []), r.data_storage_other ?? ""].filter(Boolean),
  );

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total" value={total} />
          <MetricCard label="Today" value={today} />
          <MetricCard label="This week" value={thisWeek} />
          <MetricCard
            label="India · Indonesia"
            value={`${india} · ${indonesia}`}
          />
        </div>
      </section>

      {/* Pain points */}
      <section>
        <SectionLabel>Pain points</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChartCard title="Problems cited">
            <HorizBar data={problemsData} color={PRIMARY} />
          </ChartCard>
          <ChartCard title="Top priorities">
            <HorizBar data={prioritiesData} color={ACCENT_TEAL} />
          </ChartCard>
        </div>
      </section>

      {/* Patterns */}
      <section>
        <SectionLabel>Doctor profile patterns</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ChartCard title="Specialization">
            <HorizBar data={specData} color={PRIMARY} />
          </ChartCard>
          <ChartCard title="Cities (top 10)">
            <HorizBar data={cityData} color={ACCENT_BLUE} />
          </ChartCard>
          <ChartCard title="Patients per day">
            <HorizBar data={patientsData} color={ACCENT_BLUE} />
          </ChartCard>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <ChartCard title="Paperwork time per day">
            <HorizBar data={paperworkData} color={ACCENT_TEAL} />
          </ChartCard>
          <ChartCard title="Current data storage methods">
            <HorizBar data={storageData} color={ACCENT_TEAL} />
          </ChartCard>
        </div>
      </section>

      {/* Submissions table */}
      <section>
        <SectionLabel>All submissions ({total})</SectionLabel>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <SubmissionsTable responses={responses} />
        </div>
      </section>
    </div>
  );
}
