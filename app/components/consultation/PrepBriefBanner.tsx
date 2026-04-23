"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Sparkles } from "lucide-react";

interface PrepBrief {
  summary: string;
  red_flags: string[];
  suggested_questions: string[];
  medications_to_review: string[];
}

export function PrepBriefBanner({ patientId }: { patientId: string }) {
  const [brief, setBrief] = useState<PrepBrief | null>(null);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}/prep-brief`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.prepBrief) {
          setBrief(json.prepBrief);
        }
      } catch {
        // Silent — banner just doesn't render.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (loading || !brief) return null;

  const hasRedFlags = brief.red_flags && brief.red_flags.length > 0;

  return (
    <div
      className={`glass-card border-l-4 ${hasRedFlags ? "border-red-500" : "border-primary"}`}
      data-testid="prep-brief-banner"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {hasRedFlags ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
          <div>
            <div className="text-sm font-semibold text-foreground">
              AI Prep Brief
            </div>
            <div className="text-xs text-muted-foreground">
              {hasRedFlags
                ? `${brief.red_flags.length} red flag${brief.red_flags.length > 1 ? "s" : ""} · tap to review`
                : "Summary of intake and suggested questions"}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border/60 p-4 pt-4">
          <Section label="Summary">
            <p className="text-sm leading-relaxed text-foreground">
              {brief.summary}
            </p>
          </Section>

          {hasRedFlags ? (
            <Section label="Red flags" tone="danger">
              <ul className="space-y-1.5 text-sm text-red-600">
                {brief.red_flags.map((flag, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span aria-hidden className="mt-1 text-red-500">
                      •
                    </span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {brief.suggested_questions.length ? (
            <Section label="Suggested questions">
              <ul className="space-y-1.5 text-sm text-foreground">
                {brief.suggested_questions.map((q, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span aria-hidden className="mt-1 text-muted-foreground">
                      •
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {brief.medications_to_review.length ? (
            <Section label="Medications to review">
              <div className="flex flex-wrap gap-2">
                {brief.medications_to_review.map((m, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Section({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          tone === "danger" ? "text-red-500" : "text-muted-foreground"
        }`}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
