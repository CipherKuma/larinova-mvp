import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatApptTime } from "@/lib/data/home";
import PortalHeader from "@/components/PortalHeader";
import AppointmentActions from "./AppointmentActions";

export const dynamic = "force-dynamic";

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
    .select("full_name, clinic_name, clinic_address, video_call_link")
    .eq("id", appt.doctor_id)
    .maybeSingle();

  return (
    <>
      <PortalHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-foreground/60">
            Appointment
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatApptTime(appt)}
          </h1>
          <p className="text-sm text-foreground/70">Status: {appt.status}</p>
        </div>

        <section className="space-y-2 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Doctor
          </h2>
          <p className="text-lg font-medium">
            {doctor?.full_name ?? "Your clinician"}
          </p>
          {appt.type === "video" ? (
            doctor?.video_call_link ? (
              <a
                href={doctor.video_call_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-lg bg-foreground px-5 text-sm font-medium text-background"
              >
                Join video call
              </a>
            ) : (
              <p className="text-sm text-foreground/60">
                Video link will appear closer to the appointment time.
              </p>
            )
          ) : (
            <p className="text-sm text-foreground/60">
              {doctor?.clinic_name ?? "Clinic"}
              {doctor?.clinic_address ? ` · ${doctor.clinic_address}` : ""}
            </p>
          )}
        </section>

        <section className="space-y-2 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Reason for visit
          </h2>
          <p className="text-base">{appt.reason || "Not specified"}</p>
          {appt.chief_complaint && (
            <p className="text-sm text-foreground/70">{appt.chief_complaint}</p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Intake form
          </h2>
          <p className="text-base text-foreground/70">
            Help your doctor prepare by filling in a few details before the
            visit.
          </p>
          <Link
            href={`/appointments/${appt.id}/intake`}
            className="inline-flex h-11 items-center rounded-lg border border-foreground/15 px-5 text-sm font-medium"
          >
            Open intake form
          </Link>
        </section>

        <AppointmentActions appointmentId={appt.id} status={appt.status} />
      </main>
    </>
  );
}
