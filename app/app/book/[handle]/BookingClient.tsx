"use client";

import { useState, useEffect } from "react";
import {
  DoctorCard,
  type AppointmentType,
} from "@/components/booking/DoctorCard";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { BookingForm } from "@/components/booking/BookingForm";
import { detectRegionFromTimezone } from "@/lib/booking/slots";

type Locale = "en" | "id";

interface AvailabilityRow {
  day_of_week: number;
  is_active: boolean;
}
interface DoctorInfo {
  id: string;
  full_name: string;
  specialization: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  profile_image_url: string | null;
  booking_enabled: boolean;
  slot_duration_minutes: number;
  video_call_link: string | null;
  region: "IN" | "ID";
}

interface Props {
  handle: string;
  doctor: DoctorInfo;
  availability: AvailabilityRow[];
}

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.startsWith("id") ? "id" : "en";
}

export function BookingClient({ handle, doctor }: Props) {
  const [locale, setLocale] = useState<Locale>("en");
  const [timezone, setTimezone] = useState("UTC");
  const [visitorRegion, setVisitorRegion] = useState<"IN" | "ID" | null>(null);
  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("video");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    setLocale(detectLocale());
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    setVisitorRegion(detectRegionFromTimezone(tz));
  }, []);

  const handleSlotSelected = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowForm(true);
  };

  const showCrossRegionWarning =
    !warningDismissed &&
    visitorRegion !== null &&
    visitorRegion !== doctor.region &&
    appointmentType === "in_person";

  const warningText =
    locale === "id"
      ? doctor.region === "ID"
        ? "Catatan: Dokter ini berpraktik di Indonesia. Kunjungan langsung memerlukan perjalanan ke Indonesia."
        : "Catatan: Dokter ini berpraktik di India. Kunjungan langsung memerlukan perjalanan ke India."
      : doctor.region === "ID"
        ? "Note: This doctor is based in Indonesia. In-person visits require travel to Indonesia."
        : "Note: This doctor is based in India. In-person visits require travel to India.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cross-region warning */}
      {showCrossRegionWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-700 text-sm flex-1">{warningText}</span>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-amber-500 hover:text-amber-700 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 gap-6 flex-col md:flex-row">
        {/* Left panel */}
        <div className="w-full md:w-80 shrink-0">
          <DoctorCard
            doctor={doctor}
            selectedType={appointmentType}
            onTypeChange={(t) => {
              setAppointmentType(t);
              setShowForm(false);
              setSelectedDate(null);
              setSelectedTime(null);
            }}
            detectedTimezone={timezone}
            locale={locale}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border" />

        {/* Right panel */}
        {doctor.booking_enabled && (
          <div className="flex-1 min-w-0">
            {showForm && selectedDate && selectedTime ? (
              <BookingForm
                handle={handle}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                appointmentType={appointmentType}
                doctorName={doctor.full_name}
                slotDurationMinutes={doctor.slot_duration_minutes ?? 30}
                onBack={() => setShowForm(false)}
                locale={locale}
              />
            ) : (
              <SlotPicker
                handle={handle}
                onSlotSelected={handleSlotSelected}
                locale={locale}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        Powered by{" "}
        <a
          href="https://larinova.com"
          className="hover:underline text-foreground"
        >
          Larinova
        </a>
      </footer>
    </div>
  );
}
