"use client";

import { useEffect, useState } from "react";
import { Link } from "@/src/i18n/routing";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface FlaggedThread {
  id: string;
  patient_id: string;
  tier: string;
  larinova_patients?: { id: string; full_name: string } | null;
}

export function FlaggedFollowUpAlert({
  initialThreads,
}: {
  initialThreads?: FlaggedThread[];
}) {
  const [threads, setThreads] = useState<FlaggedThread[]>(
    initialThreads ?? [],
  );

  useEffect(() => {
    if (initialThreads) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/follow-ups/flagged");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setThreads(json.threads ?? []);
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [initialThreads]);

  if (!threads.length) return null;

  const firstName =
    threads[0].larinova_patients?.full_name?.split(" ")[0] ?? "a patient";
  const more = threads.length - 1;

  return (
    <Link
      href={`/patients/${threads[0].patient_id}`}
      className="group flex items-center justify-between gap-3 rounded-xl border-l-4 border-red-500 bg-red-500/5 p-4 hover:bg-red-500/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
        <div className="text-sm">
          <div className="font-semibold text-foreground">
            {threads.length === 1
              ? `${firstName} flagged from follow-up`
              : `${firstName} + ${more} other${more > 1 ? "s" : ""} flagged`}
          </div>
          <div className="text-xs text-muted-foreground">
            Review the transcript and reach out if needed.
          </div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
    </Link>
  );
}
