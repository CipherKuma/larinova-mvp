"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, CheckCircle2 } from "lucide-react";

interface TranscriptEntry {
  role: "agent" | "patient";
  body: string;
  at?: string;
}

interface FollowUpThread {
  id: string;
  tier: "day-1" | "day-3" | "day-7" | string;
  status: string;
  scheduled_for: string;
  transcript: TranscriptEntry[];
  outcome: "improving" | "unchanged" | "flagged" | "closed" | null;
  flagged: boolean;
  exchanges_count: number;
  updated_at: string;
}

export function FollowUpThreadView({ patientId }: { patientId: string }) {
  const [threads, setThreads] = useState<FollowUpThread[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}/follow-ups`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setThreads(json.threads ?? []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (loading) return null;
  if (!threads || threads.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Follow-ups</h2>
        <span className="text-xs text-muted-foreground">
          {threads.length} thread{threads.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-3">
        {threads.map((t) => (
          <ThreadCard key={t.id} thread={t} />
        ))}
      </div>
    </section>
  );
}

function ThreadCard({ thread }: { thread: FollowUpThread }) {
  const entries = Array.isArray(thread.transcript) ? thread.transcript : [];
  const [expanded, setExpanded] = useState(thread.flagged);

  return (
    <div
      className={`glass-card overflow-hidden border-l-4 ${
        thread.flagged
          ? "border-red-500"
          : thread.outcome === "improving"
            ? "border-emerald-500"
            : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {thread.flagged ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : thread.outcome === "improving" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <div className="text-sm font-semibold text-foreground capitalize">
              {thread.tier.replace("-", " ")} check-in
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(thread.scheduled_for).toLocaleString()}
              {thread.exchanges_count
                ? ` · ${thread.exchanges_count} exchange${thread.exchanges_count === 1 ? "" : "s"}`
                : ""}
            </div>
          </div>
        </div>
        <OutcomePill outcome={thread.outcome} flagged={thread.flagged} />
      </button>

      {expanded ? (
        <div className="space-y-2 border-t border-border/60 p-4">
          {entries.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No messages yet.
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={idx}
                className={`flex flex-col gap-0.5 ${entry.role === "agent" ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    entry.role === "agent"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {entry.body}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {entry.role === "agent" ? "Agent" : "Patient"}
                  {entry.at
                    ? ` · ${new Date(entry.at).toLocaleTimeString()}`
                    : ""}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function OutcomePill({
  outcome,
  flagged,
}: {
  outcome: FollowUpThread["outcome"];
  flagged: boolean;
}) {
  if (flagged) {
    return (
      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-600">
        Flagged
      </span>
    );
  }
  if (!outcome) {
    return (
      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Pending
      </span>
    );
  }
  const tone =
    outcome === "improving"
      ? "bg-emerald-500/10 text-emerald-600"
      : outcome === "closed"
        ? "bg-muted text-muted-foreground"
        : "bg-amber-500/10 text-amber-700";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {outcome}
    </span>
  );
}
