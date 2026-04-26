"use client";

import { motion, type Variants } from "framer-motion";
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

// ─── chart palette ────────────────────────────────────────────────────────────

const EMERALD = "#10b981";
const BLUE = "#3b82f6";
const TEAL = "#0d9488";

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

// ─── custom tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1117]/90 px-3 py-2 text-xs backdrop-blur-md shadow-xl">
      <p className="text-white/60 mb-0.5 max-w-[180px] truncate">
        {payload[0].payload.name}
      </p>
      <p className="font-mono text-emerald-400 font-semibold">
        {payload[0].value} response{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

// ─── HorizBar ────────────────────────────────────────────────────────────────

function HorizBar({
  data,
  color = EMERALD,
  maxItems = 10,
}: {
  data: { name: string; count: number }[];
  color?: string;
  maxItems?: number;
}) {
  const rows = data.slice(0, maxItems);
  if (!rows.length)
    return (
      <p className="text-center text-xs text-white/20 py-8 font-mono">
        NO DATA YET
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
          tick={{ fill: "#ffffff30", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) =>
            v.length > 28 ? v.slice(0, 28) + "…" : v
          }
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar
          dataKey="count"
          radius={[0, 4, 4, 0]}
          isAnimationActive
          animationDuration={800}
          animationEasing="ease-out"
        >
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

// ─── primitives ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-3.5 w-0.5 rounded-full bg-emerald-500/70" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        {children}
      </span>
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 ${className}`}
    >
      {children}
    </div>
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
    <GlassCard>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35 mb-4">
        {title}
      </p>
      {children}
    </GlassCard>
  );
}

// ─── metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  accent = false,
  i,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  i: number;
}) {
  return (
    <motion.div
      custom={i}
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm px-5 py-4 overflow-hidden hover:border-emerald-500/20 transition-colors duration-300"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.06),transparent_70%)]" />
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">
        {label}
      </p>
      <p
        className={`font-mono text-3xl font-bold leading-none ${accent ? "text-emerald-400" : "text-white"}`}
      >
        {value}
      </p>
    </motion.div>
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
    <div className="min-h-screen bg-[#060610] text-white">
      {/* Pulse line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent animate-pulse" />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Discovery Survey
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/25 mt-1">
              Admin · localhost only
            </p>
          </div>
          <span className="font-mono text-xs border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 px-3 py-1.5 rounded-full">
            {total} response{total !== 1 ? "s" : ""}
          </span>
        </motion.div>

        {/* Metrics */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard i={0} label="Total" value={total} />
            <MetricCard i={1} label="Today" value={today} accent={today > 0} />
            <MetricCard i={2} label="This week" value={thisWeek} />
            <MetricCard
              i={3}
              label="🇮🇳 India · 🇮🇩 Indonesia"
              value={`${india} · ${indonesia}`}
            />
          </div>
        </section>

        {/* Pain Points */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <SectionLabel>Pain Points</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="Problems cited">
              <HorizBar data={problemsData} color={EMERALD} />
            </ChartCard>
            <ChartCard title="Top priorities">
              <HorizBar data={prioritiesData} color={TEAL} />
            </ChartCard>
          </div>
        </motion.section>

        {/* Patterns */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <SectionLabel>Doctor Profile Patterns</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ChartCard title="Specialization">
              <HorizBar data={specData} color={EMERALD} />
            </ChartCard>
            <ChartCard title="Cities (top 10)">
              <HorizBar data={cityData} color={BLUE} />
            </ChartCard>
            <ChartCard title="Patients per day">
              <HorizBar data={patientsData} color={BLUE} />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <ChartCard title="Paperwork time per day">
              <HorizBar data={paperworkData} color={TEAL} />
            </ChartCard>
            <ChartCard title="Current data storage methods">
              <HorizBar data={storageData} color={TEAL} />
            </ChartCard>
          </div>
        </motion.section>

        {/* Table */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <SectionLabel>All Submissions ({total})</SectionLabel>
          <GlassCard>
            <SubmissionsTable responses={responses} />
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}
