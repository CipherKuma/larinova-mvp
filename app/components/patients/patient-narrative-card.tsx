"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface NarrativePayload {
  narrative: string | null;
  generatedAt: string | null;
  lastSeen: string | null;
}

export function PatientNarrativeCard({ patientId }: { patientId: string }) {
  const [data, setData] = useState<NarrativePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}/narrative`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (!data || !data.narrative) return null;

  return (
    <div className="glass-card border-l-4 border-primary p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              AI patient summary
            </div>
            {data.lastSeen ? (
              <div className="text-[10px] text-muted-foreground">
                Last seen {new Date(data.lastSeen).toLocaleDateString()}
              </div>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {data.narrative}
          </p>
        </div>
      </div>
    </div>
  );
}
