"use client";

import Image from "next/image";

export type AppointmentType = "video" | "in_person";

interface DoctorInfo {
  full_name: string;
  specialization: string | null;
  clinic_name: string | null;
  profile_image_url: string | null;
  id: string;
  slot_duration_minutes: number;
  booking_enabled: boolean;
}

interface DoctorCardProps {
  doctor: DoctorInfo;
  selectedType: AppointmentType;
  onTypeChange: (type: AppointmentType) => void;
  detectedTimezone: string;
  locale: "en" | "id";
}

const T = {
  en: {
    video: "Video Call",
    inPerson: "In-Person Visit",
    min: (n: number) => `${n} min`,
    timezone: "Timezone",
    notAccepting: "This doctor is not currently accepting bookings.",
  },
  id: {
    video: "Video Call",
    inPerson: "Kunjungan Langsung",
    min: (n: number) => `${n} menit`,
    timezone: "Zona waktu",
    notAccepting: "Dokter ini sedang tidak menerima booking.",
  },
};

export function DoctorCard({
  doctor,
  selectedType,
  onTypeChange,
  detectedTimezone,
  locale,
}: DoctorCardProps) {
  const t = T[locale];
  const avatarUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${doctor.id}`;
  const duration = doctor.slot_duration_minutes ?? 30;

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {doctor.profile_image_url ? (
            <Image
              src={doctor.profile_image_url}
              alt={doctor.full_name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={doctor.full_name}
              className="w-full h-full"
            />
          )}
        </div>
        <div>
          <div className="font-semibold text-foreground">
            {doctor.full_name}
          </div>
          {doctor.specialization && (
            <div className="text-sm text-muted-foreground">
              {doctor.specialization}
            </div>
          )}
          {doctor.clinic_name && (
            <div className="text-xs text-muted-foreground">
              {doctor.clinic_name}
            </div>
          )}
        </div>
      </div>

      {!doctor.booking_enabled ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-3">
          {t.notAccepting}
        </p>
      ) : (
        <>
          {/* Type selector */}
          <div className="flex flex-col gap-2">
            <TypeCard
              icon="📹"
              label={t.video}
              duration={t.min(duration)}
              selected={selectedType === "video"}
              onClick={() => onTypeChange("video")}
            />
            <TypeCard
              icon="🏥"
              label={t.inPerson}
              duration={t.min(duration)}
              selected={selectedType === "in_person"}
              onClick={() => onTypeChange("in_person")}
            />
          </div>

          {/* Timezone */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{t.timezone}:</span>{" "}
            {detectedTimezone}
          </div>
        </>
      )}
    </div>
  );
}

function TypeCard({
  icon,
  label,
  duration,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  duration: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <div>
        <div
          className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}
        >
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{duration}</div>
      </div>
      {selected && (
        <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        </div>
      )}
    </button>
  );
}
