"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { Stethoscope, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface Consultation {
  id: string;
  consultation_code: string;
  start_time: string;
  end_time: string | null;
  status: string;
  chief_complaint: string | null;
  larinova_patients: {
    full_name: string;
    patient_code: string;
  } | null;
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("larinova_consultations")
        .select(
          `
          *,
          larinova_patients (
            full_name,
            patient_code
          )
        `,
        )
        .order("start_time", { ascending: false })
        .limit(50);

      if (error) throw error;

      setConsultations(data || []);
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "secondary";
      case "in_progress":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 glass-card animate-pulse" />
        <div className="h-96 glass-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("consultations.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("consultations.description")}
            </p>
          </div>
          <Button onClick={() => router.push("/consultations/new" as any)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("consultations.newConsultation")}
          </Button>
        </div>
      </div>

      {/* Consultations List */}
      <div className="glass-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {t("consultations.title")}
          </h2>
        </div>

        {consultations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">
                    {t("consultations.consultationCode")}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">
                    {t("patients.patientName")}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">
                    {t("consultations.date")}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">
                    {t("consultations.chiefComplaint")}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">
                    {t("tasks.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="border-b border-border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(
                        `/consultations/${consultation.id}/summary` as any,
                      )
                    }
                  >
                    <td className="p-4">
                      <span className="text-sm font-mono text-foreground">
                        {consultation.consultation_code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {consultation.larinova_patients?.full_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {consultation.larinova_patients?.patient_code ?? ""}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(consultation.start_time)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">
                        {consultation.chief_complaint || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusVariant(consultation.status)}>
                        {consultation.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {t("consultations.noConsultations")}
            </p>
            <Button onClick={() => router.push("/consultations/new" as any)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("consultations.newConsultation")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
