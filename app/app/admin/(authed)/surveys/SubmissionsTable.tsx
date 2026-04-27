"use client";

import { useState } from "react";
import type { SurveyRow } from "./types";
import { Search } from "lucide-react";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LocaleBadge({ locale }: { locale: "en" | "id" }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground">
      {locale === "id" ? "🇮🇩 ID" : "🇮🇳 IN"}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm text-foreground/80">{value}</p>
    </div>
  );
}

function ExpandedRow({ row }: { row: SurveyRow }) {
  const storage = [...(row.data_storage ?? []), row.data_storage_other ?? ""]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="px-4 py-4 border-t border-border bg-muted/20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <DetailRow label="Clinic" value={row.clinic} />
        <DetailRow label="Email" value={row.email ?? "—"} />
        <DetailRow label="Paperwork time" value={row.paperwork_time ?? "—"} />
        <DetailRow label="Pending shift notes" value={row.shift_notes ?? "—"} />
        <DetailRow
          label="Referral letter time"
          value={row.referral_time ?? "—"}
        />
        <DetailRow label="Data storage" value={storage || "—"} />
      </div>
      {row.priorities.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
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
        <div className="mt-3 p-3 rounded-md border border-border bg-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Tell us more
          </p>
          <p className="text-sm text-foreground/80 italic">
            &ldquo;{row.tell_us_more}&rdquo;
          </p>
        </div>
      )}
    </div>
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
      {/* Search — placeholder is the affordance, no inline icon */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Search name, specialization, city, clinic…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {responses.length === 0
              ? "No responses yet"
              : "No matches for that search"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Doctor
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Specialization
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  City
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Locale
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Top problems
                </th>
                <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className={`border-t border-border cursor-pointer transition-colors ${
                        isOpen ? "bg-muted/30" : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {fmt(r.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.specialization}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.city}
                      </td>
                      <td className="px-4 py-3">
                        <LocaleBadge locale={r.locale} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.problems.slice(0, 2).map((p) => (
                            <Tag key={p}>
                              {p.length > 22 ? p.slice(0, 22) + "…" : p}
                            </Tag>
                          ))}
                          {r.problems.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{r.problems.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                        {r.whatsapp}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={7} className="p-0">
                          <ExpandedRow row={r} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
