"use client";

import { useEffect, useState } from "react";
import { Link } from "@/src/i18n/routing";
import { Stethoscope, Clock, ArrowRight, Sparkles } from "lucide-react";

interface NextAppointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  booker_name: string | null;
  prep_brief: unknown | null;
  patient_id: string | null;
  larinova_patients?: {
    id: string;
    full_name: string;
    patient_code: string;
  } | null;
}

export function NextPatientCard() {
  const [next, setNext] = useState<NextAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/next-patient");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setNext(json.next ?? null);
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
  }, []);

  if (loading) {
    return (
      <div className="glass-card-strong h-32 animate-pulse border-l-4 border-primary/30" />
    );
  }

  if (!next) {
    return (
      <div className="glass-card-strong p-6 border-l-4 border-muted">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Stethoscope className="h-5 w-5" />
          <div className="text-sm">
            No more patients scheduled today. Take a breath.
          </div>
        </div>
      </div>
    );
  }

  const patientName =
    next.larinova_patients?.full_name ?? next.booker_name ?? "Next patient";
  const patientId = next.larinova_patients?.id ?? next.patient_id;
  const consultHref = patientId ? `/patients/${patientId}/consultation` : "#";
  const hasPrep = Boolean(next.prep_brief);

  return (
    <div className="glass-card-strong border-l-4 border-primary p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Next patient
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">
              {patientName}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {next.start_time?.slice(0, 5)}
                {next.end_time ? ` – ${next.end_time.slice(0, 5)}` : ""}
              </span>
              {next.larinova_patients?.patient_code ? (
                <span>· {next.larinova_patients.patient_code}</span>
              ) : null}
            </div>
          </div>
          {hasPrep ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Prep Brief ready
            </div>
          ) : null}
        </div>
        <Link
          href={consultHref as any}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:shadow-md transition-all"
        >
          <Stethoscope className="h-4 w-4" />
          Start consult
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
