"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Appointment } from "./AppointmentEvent";

interface AnalyticsTabProps {
  appointments: Appointment[];
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsTab({ appointments: allAppts }: AnalyticsTabProps) {
  const t = useTranslations("calendar.analytics");
  const now = new Date();

  const confirmed = allAppts.filter((a) => a.status !== "cancelled");
  const thisMonth = confirmed.filter((a) => {
    const d = new Date(a.appointment_date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const completed = allAppts.filter((a) => a.status === "completed");
  const completionRate =
    confirmed.length > 0
      ? Math.round((completed.length / confirmed.length) * 100)
      : 0;
  const videoCount = confirmed.filter((a) => a.type === "video").length;
  const inPersonCount = confirmed.filter((a) => a.type === "in_person").length;

  // Weekly data (last 8 weeks)
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - 7 * (7 - i));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const wsYmd = toYMD(weekStart);
    const weYmd = toYMD(weekEnd);
    const count = confirmed.filter(
      (a) => a.appointment_date >= wsYmd && a.appointment_date <= weYmd,
    ).length;
    return { week: getWeekLabel(wsYmd), count };
  });

  const todayYmd = toYMD(now);
  const upcoming = allAppts
    .filter((a) => a.appointment_date >= todayYmd && a.status === "confirmed")
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("totalBookings")} value={confirmed.length} />
        <StatCard label={t("thisMonth")} value={thisMonth.length} />
        <StatCard label={t("completionRate")} value={`${completionRate}%`} />
        <StatCard
          label={t("videoVsInPerson")}
          value={`${videoCount}v / ${inPersonCount}p`}
        />
      </div>

      {/* Bar chart */}
      <div className="border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">{t("weeklyBookings")}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={weeklyData}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          {t("upcomingAppointments")}
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noUpcoming")}</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 border border-border rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-lg">
                  {a.type === "video" ? "📹" : "🏥"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.booker_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.appointment_date} · {a.start_time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
