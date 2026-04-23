"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarTab } from "./CalendarTab";
import { AvailabilityTab } from "./AvailabilityTab";
import { BookingPageTab } from "./BookingPageTab";
import { AnalyticsTab } from "./AnalyticsTab";
import type { Appointment } from "./AppointmentEvent";

type Tab = "calendar" | "availability" | "bookingPage" | "analytics";

interface DoctorSettings {
  booking_handle: string;
  booking_enabled: boolean;
  slot_duration_minutes: number;
  video_call_link: string | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start: string | null;
  break_end: string | null;
}

interface CalendarPageProps {
  appUrl: string;
}

export function CalendarPage({ appUrl }: CalendarPageProps) {
  const t = useTranslations("calendar");
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, availRes] = await Promise.all([
        fetch("/api/calendar/appointments"),
        fetch("/api/calendar/availability"),
      ]);
      const apptData = await apptRes.json();
      const availData = await availRes.json();
      setAppointments(apptData.appointments ?? []);
      setSettings(availData.doctor ?? null);
      setAvailability(availData.availability ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (
    id: string,
    status: "completed" | "cancelled",
  ) => {
    const res = await fetch(`/api/calendar/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    }
  };

  const bookingUrl = settings
    ? `${appUrl}/book/${settings.booking_handle}`
    : "";

  const handleCopy = async () => {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "calendar", label: t("tabs.calendar") },
    { id: "availability", label: t("tabs.availability") },
    { id: "bookingPage", label: t("tabs.bookingPage") },
    { id: "analytics", label: t("tabs.analytics") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        {settings?.booking_handle && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 text-xs"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <ExternalLink className="w-3 h-3" />
                View booking page
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "calendar" && (
        <CalendarTab
          appointments={appointments}
          onStatusChange={handleStatusChange}
        />
      )}
      {activeTab === "availability" && settings && (
        <AvailabilityTab
          initialAvailability={availability}
          initialSlotDuration={settings.slot_duration_minutes ?? 30}
          initialVideoCallLink={settings.video_call_link}
          initialBookingEnabled={settings.booking_enabled}
        />
      )}
      {activeTab === "bookingPage" && settings && (
        <BookingPageTab
          initialHandle={settings.booking_handle}
          appUrl={appUrl}
        />
      )}
      {activeTab === "analytics" && (
        <AnalyticsTab appointments={appointments} />
      )}
    </div>
  );
}
