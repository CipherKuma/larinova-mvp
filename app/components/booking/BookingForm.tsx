"use client";

import { useState } from "react";
import { ArrowLeft, Lock, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppointmentType } from "./DoctorCard";

interface BookingFormProps {
  handle: string;
  selectedDate: string;
  selectedTime: string;
  appointmentType: AppointmentType;
  doctorName: string;
  slotDurationMinutes: number;
  onBack: () => void;
  locale: "en" | "id";
}

interface ConfirmationData {
  bookerEmail: string;
  bookerName: string;
  appointmentDate: string;
  startTime: string;
  appointmentType: AppointmentType;
  doctorName: string;
  googleCalendarUrl: string;
}

const L = {
  en: {
    title: "Your details",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    age: "Age",
    gender: "Gender",
    genderOptions: {
      male: "Male",
      female: "Female",
      other: "Other",
      prefer_not_to_say: "Prefer not to say",
    },
    reason: "Reason for visit",
    chiefComplaint: "Chief complaint",
    chiefComplaintPlaceholder: "Describe your main symptoms or concern",
    notes: "Additional notes (optional)",
    paymentTitle: "Consultation Fee Payment",
    paymentComingSoon: "Coming Soon",
    confirm: "Confirm Appointment",
    confirming: "Confirming...",
    confirmed: "Appointment Confirmed!",
    confirmedSubtitle: (email: string) =>
      `A confirmation has been sent to ${email}`,
    addToCalendar: "Add to Google Calendar",
    video: "Video Call",
    inPerson: "In-Person Visit",
  },
  id: {
    title: "Data diri",
    fullName: "Nama Lengkap",
    email: "Email",
    phone: "Telepon",
    age: "Usia",
    gender: "Jenis kelamin",
    genderOptions: {
      male: "Laki-laki",
      female: "Perempuan",
      other: "Lainnya",
      prefer_not_to_say: "Tidak ingin menyebutkan",
    },
    reason: "Alasan kunjungan",
    chiefComplaint: "Keluhan utama",
    chiefComplaintPlaceholder: "Jelaskan gejala atau keluhan utama Anda",
    notes: "Catatan tambahan (opsional)",
    paymentTitle: "Pembayaran Biaya Konsultasi",
    paymentComingSoon: "Segera Hadir",
    confirm: "Konfirmasi Janji",
    confirming: "Mengkonfirmasi...",
    confirmed: "Janji Dikonfirmasi!",
    confirmedSubtitle: (email: string) =>
      `Konfirmasi telah dikirim ke ${email}`,
    addToCalendar: "Tambah ke Google Calendar",
    video: "Video Call",
    inPerson: "Kunjungan Langsung",
  },
};

function formatDisplayDate(ymd: string): string {
  return new Date(ymd + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDisplayTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function BookingForm({
  handle,
  selectedDate,
  selectedTime,
  appointmentType,
  doctorName,
  slotDurationMinutes,
  onBack,
  locale,
}: BookingFormProps) {
  const t = L[locale];
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    booker_name: "",
    booker_email: "",
    booker_phone: "",
    booker_age: "",
    booker_gender: "",
    reason: "",
    chief_complaint: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/booking/${handle}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: selectedDate,
          start_time: selectedTime,
          type: appointmentType,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setConfirmation({
        bookerEmail: form.booker_email,
        bookerName: form.booker_name,
        appointmentDate: formatDisplayDate(selectedDate),
        startTime: formatDisplayTime(selectedTime),
        appointmentType,
        doctorName,
        googleCalendarUrl: data.googleCalendarUrl,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.confirmed}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.confirmedSubtitle(confirmation.bookerEmail)}
          </p>
        </div>
        <div className="w-full bg-muted rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doctor</span>
            <span className="font-medium">{confirmation.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{confirmation.appointmentDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{confirmation.startTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span>
              {confirmation.appointmentType === "video" ? t.video : t.inPerson}
            </span>
          </div>
        </div>
        <a
          href={confirmation.googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Calendar className="w-4 h-4" />
          {t.addToCalendar}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Back + summary */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {formatDisplayDate(selectedDate)} ·{" "}
            {formatDisplayTime(selectedTime)}
          </span>
          <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">
            {appointmentType === "video" ? t.video : t.inPerson} ·{" "}
            {slotDurationMinutes} min
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-foreground">{t.title}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">{t.fullName} *</Label>
          <Input
            required
            value={form.booker_name}
            onChange={(e) => setForm({ ...form, booker_name: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.email} *</Label>
          <Input
            required
            type="email"
            value={form.booker_email}
            onChange={(e) => setForm({ ...form, booker_email: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">{t.phone} *</Label>
          <Input
            required
            value={form.booker_phone}
            onChange={(e) => setForm({ ...form, booker_phone: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">{t.age} *</Label>
          <Input
            required
            type="text"
            inputMode="numeric"
            value={form.booker_age}
            onChange={(e) =>
              setForm({
                ...form,
                booker_age: e.target.value.replace(/[^0-9]/g, ""),
              })
            }
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.gender} *</Label>
          <Select
            required
            value={form.booker_gender}
            onValueChange={(v) => setForm({ ...form, booker_gender: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.genderOptions).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.reason} *</Label>
          <Input
            required
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.chiefComplaint} *</Label>
          <Textarea
            required
            rows={3}
            placeholder={t.chiefComplaintPlaceholder}
            value={form.chief_complaint}
            onChange={(e) =>
              setForm({ ...form, chief_complaint: e.target.value })
            }
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.notes}</Label>
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Payment stub — disabled */}
      <div className="border border-border rounded-xl p-4 opacity-50 select-none pointer-events-none">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="font-medium">{t.paymentTitle}</span>
          <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
            {t.paymentComingSoon}
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t.confirming : t.confirm}
      </Button>
    </form>
  );
}
