import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatApptTime } from "@/lib/data/home";
import PortalShell from "@/components/PortalShell";
import AppointmentActions from "./AppointmentActions";

export const dynamic = "force-dynamic";

function doctorInitials(name: string | null): string {
  if (!name) return "Dr";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusPill(status: string) {
  const map: Record<string, { dot: string; text: string; label: string }> = {
    confirmed: {
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      label: "Confirmed",
    },
    cancelled: { dot: "bg-red-400", text: "text-red-300", label: "Cancelled" },
    completed: {
      dot: "bg-foreground/40",
      text: "text-foreground/65",
      label: "Completed",
    },
  };
  const m = map[status] ?? {
    dot: "bg-foreground/40",
    text: "text-foreground/65",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-foreground/12 bg-foreground/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${m.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${m.dot} ${status === "confirmed" ? "animate-pulse" : ""}`}
      />
      {m.label}
    </span>
  );
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: patient } = await supabase
    .from("larinova_patients")
    .select("full_name")
    .eq("email", user.email)
    .maybeSingle();

  const { data: appt } = await supabase
    .from("larinova_appointments")
    .select(
      "id, doctor_id, appointment_date, start_time, end_time, type, status, reason, chief_complaint, notes, booker_email",
    )
    .eq("id", id)
    .maybeSingle();

  if (!appt) notFound();
  if (appt.booker_email !== user.email) notFound();

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select(
      "full_name, specialization, clinic_name, clinic_address, video_call_link, profile_image_url",
    )
    .eq("id", appt.doctor_id)
    .maybeSingle();

  const isVideo = appt.type === "video";
  const docName = doctor?.full_name?.trim() ?? null;
  const docTitle = docName ? `Dr. ${docName}` : "Your clinician";

  return (
    <PortalShell email={user.email} name={patient?.full_name ?? null}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 md:px-8 md:py-12">
        {/* Hero */}
        <header className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55 transition hover:text-foreground/85"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Home
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85">
                {isVideo ? "Video consultation" : "In-person visit"}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
                {formatApptTime(appt)}
              </h1>
            </div>
            {statusPill(appt.status)}
          </div>
        </header>

        {/* Doctor */}
        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-card/45 p-5">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 font-mono text-sm font-semibold tracking-wide text-foreground"
            >
              {doctorInitials(docName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold leading-tight">
                {docTitle}
              </p>
              {doctor?.specialization &&
              doctor.specialization !== "Not Specified" ? (
                <p className="mt-0.5 text-sm text-foreground/60">
                  {doctor.specialization}
                </p>
              ) : null}
              {isVideo ? (
                doctor?.video_call_link ? (
                  <a
                    href={doctor.video_call_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] transition hover:brightness-110"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    Join video call
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-foreground/55">
                    Video link arrives by email & WhatsApp closer to the visit.
                  </p>
                )
              ) : doctor?.clinic_name || doctor?.clinic_address ? (
                <p className="mt-2 text-sm text-foreground/70">
                  {doctor.clinic_name}
                  {doctor.clinic_address ? (
                    <>
                      <span className="text-foreground/30"> · </span>
                      <span className="text-foreground/55">
                        {doctor.clinic_address}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 text-sm text-foreground/55">
                  Clinic details will be shared by email & WhatsApp before the
                  visit.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Reason */}
        {(appt.reason || appt.chief_complaint) && (
          <section className="rounded-2xl border border-foreground/10 bg-card/45 p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Reason for visit
            </h2>
            {appt.reason && (
              <p className="mt-2 text-base font-medium text-foreground/90">
                {appt.reason}
              </p>
            )}
            {appt.chief_complaint && (
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/65">
                {appt.chief_complaint}
              </p>
            )}
          </section>
        )}

        {/* Intake CTA */}
        <section className="flex flex-col items-start gap-4 rounded-2xl border border-foreground/10 bg-card/45 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Intake form
            </h2>
            <p className="text-sm text-foreground/80">
              Two quiet minutes save fifteen in the clinic.
            </p>
          </div>
          <Link
            href={`/appointments/${appt.id}/intake`}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-foreground/15 bg-foreground/[0.02] px-5 text-sm font-medium text-foreground/85 transition hover:border-foreground/30 hover:bg-foreground/[0.05]"
          >
            Open intake
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="m13 5 7 7-7 7" />
            </svg>
          </Link>
        </section>

        <AppointmentActions appointmentId={appt.id} status={appt.status} />
      </main>
    </PortalShell>
  );
}
