"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface Consultation {
  id: string;
  consultation_code: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  status: string;
  diagnosis: string | null;
  summary: string | null;
  ai_summary: string | null;
  chief_complaint: string | null;
  created_at: string;
  doctor: {
    full_name: string;
    specialization: string | null;
  } | null;
}

export default function ConsultationsView({
  patientId,
}: {
  patientId: string;
}) {
  const t = useTranslations("patients");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConsultations() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("larinova_consultations")
        .select(
          `
          *,
          doctor:larinova_doctors!doctor_id (
            full_name,
            specialization
          )
        `,
        )
        .eq("patient_id", patientId)
        .order("start_time", { ascending: false });

      if (error) {
        console.error("Error fetching consultations:", error);
      } else {
        setConsultations(data || []);
      }
      setLoading(false);
    }

    fetchConsultations();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-muted-foreground">
          {t("loadingConsultations")}
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          {t("noConsultationsTitle")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("noConsultationsDesc")}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary text-primary-foreground border border-primary";
      case "scheduled":
        return "bg-secondary text-foreground border border-border";
      case "cancelled":
        return "bg-muted text-muted-foreground border border-border";
      default:
        return "bg-accent text-foreground border border-border";
    }
  };

  return (
    <div className="space-y-4">
      {consultations.map((consultation) => (
        <div
          key={consultation.id}
          className="glass-card p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  {consultation.doctor?.full_name || t("unknownDoctor")}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded capitalize font-medium ${getStatusColor(consultation.status)}`}
                >
                  {consultation.status}
                </span>
                <span className="text-xs px-2 py-1 bg-secondary border border-border text-foreground rounded font-mono">
                  {consultation.consultation_code}
                </span>
              </div>
              {consultation.doctor?.specialization && (
                <p className="text-sm text-muted-foreground">
                  {consultation.doctor.specialization}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {new Date(consultation.start_time).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              {consultation.duration_minutes && (
                <div className="text-xs text-muted-foreground">
                  {consultation.duration_minutes} {t("mins")}
                </div>
              )}
            </div>
          </div>

          {consultation.chief_complaint && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                {t("chiefComplaint")}
              </span>
              <p className="text-sm text-foreground mt-1">
                {consultation.chief_complaint}
              </p>
            </div>
          )}

          {consultation.diagnosis && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                {t("diagnosisLabel")}
              </span>
              <p className="text-sm text-foreground mt-1">
                {consultation.diagnosis}
              </p>
            </div>
          )}

          {(consultation.summary || consultation.ai_summary) && (
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                {t("summaryLabel")}
              </span>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {consultation.summary || consultation.ai_summary}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
