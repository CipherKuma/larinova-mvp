"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { Calendar, CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TourGuide } from "@/components/TourGuide";
import { HelenaInlineChat } from "@/components/chat/HelenaInlineChat";
import { NextPatientCard } from "@/components/dashboard/next-patient-card";
import { FlaggedFollowUpAlert } from "@/components/patients/flagged-follow-up-alert";

interface Task {
  id: string;
  title: string;
  description: string;
  type: "follow_up" | "prescription_review" | "record_completion" | "general";
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  patient: {
    full_name: string;
    patient_code: string;
  } | null;
}

interface Consultation {
  id: string;
  consultation_code: string;
  start_time: string;
  status: string;
  larinova_patients: {
    full_name: string;
    patient_code: string;
  } | null;
}

interface DashboardData {
  tasks: Task[];
  todayConsultations: Consultation[];
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const startTour = searchParams.get("startTour");
    if (startTour === "true") {
      setTimeout(() => setShowTour(true), 500);
      const url = new URL(window.location.href);
      url.searchParams.delete("startTour");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/home");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale === "id" ? "id-ID" : "en-IN", {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const translatePriority = (priority: string): string => {
    switch (priority) {
      case "urgent":
        return t("tasks.urgent");
      case "high":
        return t("tasks.high");
      case "medium":
        return t("tasks.medium");
      case "low":
        return t("tasks.low");
      default:
        return priority;
    }
  };

  const translateStatus = (status: string): string => {
    switch (status) {
      case "completed":
        return t("consultations.statusCompleted");
      case "in_progress":
        return t("consultations.statusInProgress");
      case "scheduled":
        return t("consultations.statusScheduled");
      case "cancelled":
        return t("consultations.statusCancelled");
      default:
        return status.replace("_", " ");
    }
  };

  const sortedTasks = data?.tasks
    ? [...data.tasks].sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4),
      )
    : [];

  if (loading) {
    return (
      <div className="flex gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 h-full">
        <div className="w-[70%] glass-card animate-pulse" />
        <div className="w-[30%] flex flex-col gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5">
          <div className="flex-1 glass-card animate-pulse" />
          <div className="flex-1 glass-card animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <FlaggedFollowUpAlert />
      <NextPatientCard />

      <div className="flex gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 flex-1 min-h-0">
        {/* Left: MedicalGPT (70%) */}
        <div className="w-[70%] relative">
          <HelenaInlineChat />
        </div>

        {/* Right: Tasks + Schedule (30%) */}
        <div className="w-[30%] flex flex-col gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5">
          {/* Priority Tasks */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
              <h2 className="text-sm font-semibold text-foreground">
                {t("dashboard.latestTasks")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {sortedTasks.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {sortedTasks.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-secondary">
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("tasks.title")}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("tasks.priority")}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("tasks.patient")}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("tasks.dueDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push("/tasks" as any)}
                      >
                        <td className="p-2">
                          <span className="text-xs font-medium text-foreground truncate block max-w-[120px]">
                            {task.title}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge
                            className={
                              getPriorityColor(task.priority) + " text-xs"
                            }
                          >
                            {translatePriority(task.priority)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-foreground">
                            {task.patient?.full_name || "-"}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-foreground">
                            {task.due_date ? formatDate(task.due_date) : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.noPendingTasks")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
              <h2 className="text-sm font-semibold text-foreground">
                {t("dashboard.todaySchedule")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {data?.todayConsultations?.length || 0}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {data?.todayConsultations &&
              data.todayConsultations.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-secondary">
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("patients.patientName")}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("consultations.time")}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-2">
                        {t("tasks.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todayConsultations.map((consultation) => (
                      <tr
                        key={consultation.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(
                            `/consultations/${consultation.id}/summary` as any,
                          )
                        }
                      >
                        <td className="p-2">
                          <span className="text-xs font-medium text-foreground">
                            {consultation.larinova_patients?.full_name ?? "—"}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-foreground">
                            {formatTime(consultation.start_time)}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={getStatusVariant(consultation.status)}
                            className="text-xs"
                          >
                            {translateStatus(consultation.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-4">
                    <Calendar className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.noConsultationsToday")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TourGuide isOpen={showTour} onComplete={() => setShowTour(false)} />
    </div>
  );
}
