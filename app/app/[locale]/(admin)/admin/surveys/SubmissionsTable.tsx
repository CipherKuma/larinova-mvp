"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SurveyRow } from "./types";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LocaleBadge({ locale }: { locale: "en" | "id" }) {
  return (
    <span
      className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
        locale === "id"
          ? "border-blue-500/25 bg-blue-500/10 text-blue-400"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
      }`}
    >
      {locale === "id" ? "🇮🇩 ID" : "🇮🇳 IN"}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/50 whitespace-nowrap">
      {children}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-white/70">{value}</p>
    </div>
  );
}

function ExpandedRow({ row }: { row: SurveyRow }) {
  const storage = [...(row.data_storage ?? []), row.data_storage_other ?? ""]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="px-4 py-4 border-t border-white/[0.05] bg-white/[0.02]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <DetailRow label="Clinic" value={row.clinic} />
          <DetailRow label="Email" value={row.email ?? "—"} />
          <DetailRow label="Paperwork time" value={row.paperwork_time ?? "—"} />
          <DetailRow
            label="Pending shift notes"
            value={row.shift_notes ?? "—"}
          />
          <DetailRow
            label="Referral letter time"
            value={row.referral_time ?? "—"}
          />
          <DetailRow label="Data storage" value={storage || "—"} />
        </div>
        {row.priorities.length > 0 && (
          <div className="mb-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25 mb-1.5">
              Priorities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {row.priorities.map((p) => (
                <Tag key={p}>{p}</Tag>
              ))}
            </div>
          </div>
        )}
        {row.tell_us_more && (
          <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25 mb-1">
              Tell us more
            </p>
            <p className="text-sm text-white/60 italic">
              &ldquo;{row.tell_us_more}&rdquo;
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SubmissionsTable({
  responses,
}: {
  responses: SurveyRow[];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = responses.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.specialization.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.clinic.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search name, specialization, city, clinic…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30 transition-colors font-mono text-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/20">
            {responses.length === 0
              ? "No responses yet"
              : "No matches for that search"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/[0.07] overflow-hidden">
          {/* Table head */}
          <div className="grid grid-cols-[120px_1fr_140px_110px_60px_1fr_120px] gap-0 border-b border-white/[0.07] bg-white/[0.03]">
            {[
              "Date",
              "Doctor",
              "Specialization",
              "City",
              "Locale",
              "Top Problems",
              "Contact",
            ].map((h, i) => (
              <div
                key={i}
                className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-white/25"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              {/* Main row */}
              <div
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="group grid grid-cols-[120px_1fr_140px_110px_60px_1fr_120px] items-center border-b border-white/[0.04] hover:bg-white/[0.025] cursor-pointer transition-colors duration-150 relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500/0 group-hover:bg-emerald-500/50 transition-colors duration-150" />
                <div className="px-4 py-3.5 font-mono text-[11px] text-white/30">
                  {fmt(r.created_at)}
                </div>
                <div className="px-4 py-3.5 text-sm font-medium text-white/90">
                  {r.name}
                </div>
                <div className="px-4 py-3.5 text-sm text-white/50">
                  {r.specialization}
                </div>
                <div className="px-4 py-3.5 text-sm text-white/50">
                  {r.city}
                </div>
                <div className="px-4 py-3.5">
                  <LocaleBadge locale={r.locale} />
                </div>
                <div className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {r.problems.slice(0, 2).map((p) => (
                      <Tag key={p}>
                        {p.length > 22 ? p.slice(0, 22) + "…" : p}
                      </Tag>
                    ))}
                    {r.problems.length > 2 && (
                      <span className="font-mono text-[10px] text-white/25">
                        +{r.problems.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3.5 font-mono text-[11px] text-white/35">
                  {r.whatsapp}
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {expanded === r.id && <ExpandedRow key="exp" row={r} />}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
