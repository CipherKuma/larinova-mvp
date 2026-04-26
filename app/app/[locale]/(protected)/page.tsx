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
      <div className="flex flex-col gap-3 md:flex-row md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 md:h-full">
        <div className="h-32 md:h-auto md:w-[70%] glass-card animate-pulse" />
        <div className="md:w-[30%] flex flex-col gap-3 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5">
          <div className="h-40 md:flex-1 glass-card animate-pulse" />
          <div className="h-40 md:flex-1 glass-card animate-pulse" />
        </div>
      </div>
    );
  }

  const tasksList = (
    <div className="flex flex-col md:flex-1 md:overflow-hidden glass-card">
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">
          {t("dashboard.latestTasks")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {sortedTasks.length}
        </span>
      </div>
      <div className="md:flex-1 md:overflow-auto">
        {sortedTasks.length > 0 ? (
          <>
            {/* Mobile: card list */}
            <ul className="md:hidden divide-y divide-border">
              {sortedTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => router.push("/tasks" as any)}
                    className="w-full text-left px-3 py-3 min-h-[56px] active:bg-muted/40 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </span>
                        <Badge
                          className={
                            getPriorityColor(task.priority) +
                            " text-[10px] shrink-0"
                          }
                        >
                          {translatePriority(task.priority)}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        {task.patient?.full_name ?? "—"}
                        {task.due_date ? ` · ${formatDate(task.due_date)}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: dense table */}
            <table className="hidden md:table w-full">
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
                        className={getPriorityColor(task.priority) + " text-xs"}
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
          </>
        ) : (
          <div className="flex items-center justify-center md:h-full py-8">
            <div className="text-center">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {t("dashboard.noPendingTasks")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const todayList = (
    <div className="flex flex-col md:flex-1 md:overflow-hidden glass-card">
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">
          {t("dashboard.todaySchedule")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {data?.todayConsultations?.length || 0}
        </span>
      </div>
      <div className="md:flex-1 md:overflow-auto">
        {data?.todayConsultations && data.todayConsultations.length > 0 ? (
          <>
            {/* Mobile: card list */}
            <ul className="md:hidden divide-y divide-border">
              {data.todayConsultations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/consultations/${c.id}/summary` as any)
                    }
                    className="w-full text-left px-3 py-3 min-h-[56px] active:bg-muted/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {c.larinova_patients?.full_name ?? "—"}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {formatTime(c.start_time)}
                      </div>
                    </div>
                    <Badge
                      variant={getStatusVariant(c.status)}
                      className="text-[10px] shrink-0"
                    >
                      {translateStatus(c.status)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: dense table */}
            <table className="hidden md:table w-full">
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
          </>
        ) : (
          <div className="flex items-center justify-center md:h-full py-8">
            <div className="text-center">
              <Calendar className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {t("dashboard.noConsultationsToday")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 md:h-full">
      <FlaggedFollowUpAlert />
      <NextPatientCard />

      {/* Mobile: stacked Today → Tasks → Helena */}
      {/* Desktop: 70/30 grid with Helena left, Tasks+Today right */}
      <div className="flex flex-col gap-3 md:flex-row md:gap-2 md:gap-2 lg:gap-3 xl:gap-4 2xl:gap-5 md:flex-1 md:min-h-0">
        {/* Mobile order: Today first, Tasks second */}
        <div className="contents md:hidden">
          {todayList}
          {tasksList}
        </div>

        {/* Desktop: chat 70% */}
        <div className="hidden md:block md:w-[70%] relative">
          <HelenaInlineChat />
        </div>

        {/* Desktop: Tasks + Today 30% */}
        <div className="hidden md:flex md:w-[30%] flex-col gap-2 lg:gap-3 xl:gap-4 2xl:gap-5">
          {tasksList}
          {todayList}
        </div>

        {/* Mobile: Helena last, full-width, capped height */}
        <div className="md:hidden h-[480px] relative">
          <HelenaInlineChat />
        </div>
      </div>

      <TourGuide isOpen={showTour} onComplete={() => setShowTour(false)} />
    </div>
  );
}
