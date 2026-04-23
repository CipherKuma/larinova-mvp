"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start: string | null;
  break_end: string | null;
}

interface AvailabilityTabProps {
  initialAvailability: AvailabilityRow[];
  initialSlotDuration: number;
  initialVideoCallLink: string | null;
  initialBookingEnabled: boolean;
}

const DEFAULT_DAYS: AvailabilityRow[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  day_of_week: d,
  start_time: "09:00",
  end_time: "17:00",
  is_active: d >= 1 && d <= 5,
  break_start: null,
  break_end: null,
}));

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityTab({
  initialAvailability,
  initialSlotDuration,
  initialVideoCallLink,
  initialBookingEnabled,
}: AvailabilityTabProps) {
  const t = useTranslations("calendar.availability");

  const merged = DEFAULT_DAYS.map((def) => {
    const loaded = initialAvailability.find(
      (a) => a.day_of_week === def.day_of_week,
    );
    return loaded ?? def;
  });

  const [rows, setRows] = useState<AvailabilityRow[]>(merged);
  const [slotDuration, setSlotDuration] = useState(initialSlotDuration ?? 30);
  const [videoCallLink, setVideoCallLink] = useState(
    initialVideoCallLink ?? "",
  );
  const [bookingEnabled, setBookingEnabled] = useState(
    initialBookingEnabled ?? true,
  );
  const [saving, setSaving] = useState(false);

  const updateRow = (dayOfWeek: number, patch: Partial<AvailabilityRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.day_of_week === dayOfWeek ? { ...r, ...patch } : r)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/calendar/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: rows,
          slot_duration_minutes: slotDuration,
          video_call_link: videoCallLink || null,
          booking_enabled: bookingEnabled,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("saved"));
    } catch {
      toast.error("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Slot duration */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium min-w-[120px]">
          {t("slotDuration")}
        </Label>
        <Select
          value={String(slotDuration)}
          onValueChange={(v) => setSlotDuration(Number(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[15, 30, 45, 60].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accept bookings toggle */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium min-w-[120px]">
          Accept bookings
        </Label>
        <Switch checked={bookingEnabled} onCheckedChange={setBookingEnabled} />
      </div>

      {/* Day rows */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.day_of_week}
            className={`flex flex-col gap-2 p-3 ${!row.is_active ? "bg-muted/30" : ""}`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Switch
                checked={row.is_active}
                onCheckedChange={(v) =>
                  updateRow(row.day_of_week, { is_active: v })
                }
              />
              <span
                className={`text-sm font-medium min-w-[80px] ${
                  !row.is_active ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {DAY_NAMES[row.day_of_week]}
              </span>
              {row.is_active && (
                <>
                  <Input
                    type="time"
                    value={row.start_time}
                    onChange={(e) =>
                      updateRow(row.day_of_week, {
                        start_time: e.target.value,
                      })
                    }
                    className="w-28 text-xs"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="time"
                    value={row.end_time}
                    onChange={(e) =>
                      updateRow(row.day_of_week, { end_time: e.target.value })
                    }
                    className="w-28 text-xs"
                  />
                </>
              )}
            </div>
            {row.is_active && (
              <div className="pl-12 flex items-center gap-2 flex-wrap">
                {row.break_start ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {t("breakTime")}:
                    </span>
                    <Input
                      type="time"
                      value={row.break_start ?? ""}
                      onChange={(e) =>
                        updateRow(row.day_of_week, {
                          break_start: e.target.value,
                        })
                      }
                      className="w-24 text-xs"
                    />
                    <span className="text-muted-foreground text-xs">–</span>
                    <Input
                      type="time"
                      value={row.break_end ?? ""}
                      onChange={(e) =>
                        updateRow(row.day_of_week, {
                          break_end: e.target.value,
                        })
                      }
                      className="w-24 text-xs"
                    />
                    <button
                      onClick={() =>
                        updateRow(row.day_of_week, {
                          break_start: null,
                          break_end: null,
                        })
                      }
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      {t("removeBreak")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      updateRow(row.day_of_week, {
                        break_start: "13:00",
                        break_end: "14:00",
                      })
                    }
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    + {t("addBreak")}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Video call link */}
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">Video call link</Label>
        <Input
          value={videoCallLink}
          onChange={(e) => setVideoCallLink(e.target.value)}
          placeholder="https://meet.google.com/..."
          className="max-w-sm"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-fit">
        {saving ? "Saving..." : t("saveChanges")}
      </Button>
    </div>
  );
}
