"use client";

import { useParams } from "next/navigation";
import { Link, useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { Stethoscope, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ConsultationListItem {
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

export function ConsultationsClient({
  consultations,
}: {
  consultations: ConsultationListItem[];
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

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

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="md:glass-card md:p-6 px-1 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
              {t("consultations.title")}
            </h1>
            <p className="hidden md:block text-sm text-muted-foreground mt-1">
              {t("consultations.description")}
            </p>
          </div>
          <Button className="hidden md:inline-flex" asChild>
            <Link href="/consultations/new">
              <Plus className="w-4 h-4 mr-2" />
              {t("consultations.newConsultation")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="md:glass-card">
        <div className="hidden md:block p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {t("consultations.title")}
          </h2>
        </div>

        {consultations.length > 0 ? (
          <>
            <ul className="md:hidden divide-y divide-border border-y border-border bg-card">
              {consultations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/consultations/${c.id}/summary` as any)
                    }
                    className="w-full text-left px-4 py-3.5 min-h-[68px] active:bg-muted/40 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground truncate">
                          {c.larinova_patients?.full_name ?? "-"}
                        </span>
                        <Badge
                          variant={getStatusVariant(c.status)}
                          className="text-[10px] shrink-0"
                        >
                          {c.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        {formatDateTime(c.start_time)}
                      </div>
                      {c.chief_complaint && (
                        <div className="mt-1 text-xs text-foreground/80 line-clamp-2">
                          {c.chief_complaint}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="hidden md:block overflow-x-auto">
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
                            {consultation.larinova_patients?.full_name ?? "-"}
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {t("consultations.noConsultations")}
            </p>
            <Button asChild>
              <Link href="/consultations/new">
                <Plus className="w-4 h-4 mr-2" />
                {t("consultations.newConsultation")}
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Link
        href="/consultations/new"
        aria-label={t("consultations.newConsultation")}
        className="md:hidden fixed z-40 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom))",
        }}
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
