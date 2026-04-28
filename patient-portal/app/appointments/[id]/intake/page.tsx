import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatApptTime } from "@/lib/data/home";
import PortalShell from "@/components/PortalShell";
import IntakeForm from "./IntakeForm";

export const dynamic = "force-dynamic";

const DEFAULT_QUESTIONS = [
  {
    key: "symptoms",
    label: "What symptoms are you experiencing?",
    type: "textarea",
  },
  { key: "duration", label: "How long have you had them?", type: "text" },
  {
    key: "medications",
    label: "Any medications you are currently taking?",
    type: "textarea",
  },
  { key: "allergies", label: "Known allergies?", type: "text" },
];

export default async function IntakePage({
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
    .select("id, booker_email, doctor_id, reason, appointment_date, start_time")
    .eq("id", id)
    .maybeSingle();

  if (!appt || appt.booker_email !== user.email) notFound();

  type Template = {
    id: string;
    questions: Array<{ key: string; label: string; type?: string }>;
  };
  let template: Template | null = null;
  try {
    const { data } = await supabase
      .from("larinova_intake_templates")
      .select("id, questions")
      .eq("doctor_id", appt.doctor_id)
      .maybeSingle();
    if (data) {
      template = data as unknown as Template;
    }
  } catch {
    template = null;
  }

  const questions = template?.questions ?? DEFAULT_QUESTIONS;

  return (
    <PortalShell email={user.email} name={patient?.full_name ?? null}>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
        <Link
          href={`/appointments/${appt.id}`}
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
          Back to appointment
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85">
                Pre-visit intake
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Tell your doctor about your symptoms.
              </h1>
              <p className="max-w-prose text-sm text-foreground/65">
                Two minutes now saves fifteen at the clinic. Everything is
                optional — share what feels relevant.
              </p>
            </div>

            <IntakeForm appointmentId={appt.id} questions={questions} />
          </div>

          {/* Right rail — only on lg+ */}
          <aside className="hidden h-fit space-y-5 rounded-2xl border border-foreground/10 bg-card/40 p-5 lg:block lg:sticky lg:top-24">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/55">
                Appointment
              </p>
              <p className="font-display text-base font-semibold">
                {formatApptTime(appt)}
              </p>
              {appt.reason && (
                <p className="text-xs text-foreground/60">{appt.reason}</p>
              )}
            </div>
            <hr className="border-foreground/8" />
            <div className="space-y-3 text-xs leading-relaxed text-foreground/65">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <p>
                  Your doctor reads this <em>before</em> you arrive — saves the
                  awkward typing during the consult.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
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
                    <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
                  </svg>
                </span>
                <p>
                  Stored privately. Only you and the doctor on this appointment
                  can see it.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <p>You can come back and edit this anytime before the visit.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </PortalShell>
  );
}
