"use client";

import { useState } from "react";
import { Video, Building2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "video" | "in_person";
  status: "confirmed" | "cancelled" | "completed";
  booker_name: string;
  booker_email: string;
  booker_phone: string;
  booker_age: number;
  booker_gender: string;
  reason: string;
  chief_complaint: string;
  notes: string | null;
}

interface AppointmentEventProps {
  appointment: Appointment;
  compact?: boolean;
  onStatusChange: (id: string, status: "completed" | "cancelled") => void;
}

export function AppointmentEvent({
  appointment,
  compact,
  onStatusChange,
}: AppointmentEventProps) {
  const [open, setOpen] = useState(false);
  const isVideo = appointment.type === "video";
  const isCancelled = appointment.status === "cancelled";

  const bg = isCancelled
    ? "bg-muted/50 border-muted text-muted-foreground"
    : isVideo
      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`w-full text-left rounded border px-2 py-1 text-xs font-medium truncate transition-opacity ${bg} ${isCancelled ? "line-through opacity-60" : ""}`}
        >
          {isVideo ? (
            <Video className="inline w-3 h-3 mr-1" />
          ) : (
            <Building2 className="inline w-3 h-3 mr-1" />
          )}
          {compact
            ? appointment.start_time
            : `${appointment.start_time} ${appointment.booker_name}`}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" side="right">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isVideo ? (
              <Video className="w-4 h-4 text-indigo-500" />
            ) : (
              <Building2 className="w-4 h-4 text-cyan-500" />
            )}
            <span className="font-semibold text-sm">
              {appointment.booker_name}
            </span>
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                appointment.status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : appointment.status === "completed"
                    ? "bg-muted text-muted-foreground"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {appointment.status}
            </span>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Time:</span>{" "}
              {appointment.start_time} – {appointment.end_time}
            </div>
            <div>
              <span className="font-medium text-foreground">Email:</span>{" "}
              {appointment.booker_email}
            </div>
            <div>
              <span className="font-medium text-foreground">Phone:</span>{" "}
              {appointment.booker_phone}
            </div>
            <div>
              <span className="font-medium text-foreground">Age:</span>{" "}
              {appointment.booker_age} · {appointment.booker_gender}
            </div>
            <div>
              <span className="font-medium text-foreground">Reason:</span>{" "}
              {appointment.reason}
            </div>
            <div>
              <span className="font-medium text-foreground">
                Chief complaint:
              </span>{" "}
              {appointment.chief_complaint}
            </div>
            {appointment.notes && (
              <div>
                <span className="font-medium text-foreground">Notes:</span>{" "}
                {appointment.notes}
              </div>
            )}
          </div>
          {appointment.status === "confirmed" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1 text-xs"
                onClick={() => {
                  onStatusChange(appointment.id, "completed");
                  setOpen(false);
                }}
              >
                <CheckCircle className="w-3 h-3" /> Mark Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1 text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  onStatusChange(appointment.id, "cancelled");
                  setOpen(false);
                }}
              >
                <X className="w-3 h-3" /> Cancel
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
