"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentEvent, type Appointment } from "./AppointmentEvent";

type View = "month" | "week" | "day";

interface CalendarTabProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: "completed" | "cancelled") => void;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(base: Date): Date[] {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarTab({
  appointments,
  onStatusChange,
}: CalendarTabProps) {
  const isMobile =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 767px)").matches;
  const [view, setView] = useState<View>(isMobile ? "day" : "week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const byDate = appointments.reduce<Record<string, Appointment[]>>(
    (acc, a) => {
      (acc[a.appointment_date] ??= []).push(a);
      return acc;
    },
    {},
  );

  const nav = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const today = toYMD(new Date());

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:flex-wrap gap-3 md:gap-2">
        <div className="flex items-center gap-1 md:gap-2 justify-between md:justify-start">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => nav(-1)}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm md:min-w-[160px] text-center">
              {view === "month"
                ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : view === "week"
                  ? `Week of ${getWeekDates(currentDate)[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : currentDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => nav(1)}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs min-h-[40px]"
          >
            Today
          </Button>
        </div>
        {/* View switcher — month/week hidden on mobile (not usable at 375px) */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 self-end md:self-auto">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors min-h-[36px] ${
                v !== "day" ? "hidden md:inline-flex items-center" : ""
              } ${
                view === v
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month view (md+ only) */}
      {view === "month" && (
        <div className="hidden md:block border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          {(() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells: (number | null)[] = [
              ...Array(firstDay).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];
            while (cells.length % 7 !== 0) cells.push(null);
            const rows: (number | null)[][] = [];
            for (let i = 0; i < cells.length; i += 7)
              rows.push(cells.slice(i, i + 7));
            return rows.map((row, ri) => (
              <div
                key={ri}
                className="grid grid-cols-7 border-b border-border last:border-0"
              >
                {row.map((day, ci) => {
                  if (!day)
                    return (
                      <div
                        key={ci}
                        className="min-h-[80px] border-r border-border last:border-0 bg-muted/20"
                      />
                    );
                  const ymd = toYMD(new Date(year, month, day));
                  const dayAppts = byDate[ymd] ?? [];
                  const isToday = ymd === today;
                  return (
                    <div
                      key={ci}
                      className="min-h-[80px] border-r border-border last:border-0 p-1"
                    >
                      <div
                        className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map((a) => (
                          <AppointmentEvent
                            key={a.id}
                            appointment={a}
                            compact
                            onStatusChange={onStatusChange}
                          />
                        ))}
                        {dayAppts.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayAppts.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      )}

      {/* Week view (md+ only) */}
      {view === "week" && (
        <div className="hidden md:block border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {getWeekDates(currentDate).map((d) => {
              const ymd = toYMD(d);
              const dayAppts = byDate[ymd] ?? [];
              const isToday = ymd === today;
              return (
                <div
                  key={ymd}
                  className="border-r border-border last:border-0 min-h-[200px]"
                >
                  <div
                    className={`py-2 text-center text-xs border-b border-border ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="text-muted-foreground">
                      {DAYS_SHORT[d.getDay()]}
                    </div>
                    <div
                      className={`font-semibold ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="p-1 space-y-1">
                    {dayAppts.map((a) => (
                      <AppointmentEvent
                        key={a.id}
                        appointment={a}
                        onStatusChange={onStatusChange}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {view === "day" && (
        <div className="border border-border rounded-xl p-4">
          <div className="space-y-2">
            {(byDate[toYMD(currentDate)] ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No appointments on this day.
              </p>
            ) : (
              (byDate[toYMD(currentDate)] ?? []).map((a) => (
                <AppointmentEvent
                  key={a.id}
                  appointment={a}
                  onStatusChange={onStatusChange}
                />
              ))
            )}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No appointments yet. Share your booking link to get started.
        </p>
      )}
    </div>
  );
}
