import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatApptTime, loadHomeData } from "@/lib/data/home";
import PortalShell from "@/components/PortalShell";

export const dynamic = "force-dynamic";

function firstName(name: string | null): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const data = await loadHomeData(supabase, user.email);
  const fname = firstName(data.patientName);

  return (
    <PortalShell email={user.email} name={data.patientName}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 md:px-8 md:py-12">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85">
            {timeOfDayGreeting()}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-[40px] md:leading-[1.05]">
            {fname ? (
              <>
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                  {fname}
                </span>
                .
              </>
            ) : (
              "Welcome back."
            )}
          </h1>
          <p className="max-w-prose text-sm text-foreground/65">
            Everything for your next visit, in one quiet place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Upcoming appointment — hero card spans both columns on desktop */}
          <section className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-gradient-to-br from-card/85 to-card/40 p-5 md:col-span-2 md:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/12 blur-3xl"
            />
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Upcoming
              </span>
              {data.upcoming && (
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/55">
                  {data.upcoming.type === "video" ? "Video visit" : "In-person"}
                </span>
              )}
            </div>

            {data.upcoming ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="font-display text-2xl font-semibold leading-tight md:text-3xl">
                    {formatApptTime(data.upcoming)}
                  </p>
                  {data.upcoming.reason && (
                    <p className="mt-1.5 max-w-prose text-sm text-foreground/65">
                      {data.upcoming.reason}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href={`/appointments/${data.upcoming.id}`}
                    className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] transition hover:brightness-110"
                  >
                    Manage appointment
                  </Link>
                  <Link
                    href={`/appointments/${data.upcoming.id}/intake`}
                    className="inline-flex h-11 items-center rounded-lg border border-foreground/15 bg-foreground/[0.02] px-4 text-sm font-medium text-foreground/85 transition hover:border-foreground/30 hover:bg-foreground/[0.05]"
                  >
                    Fill intake
                    <svg
                      viewBox="0 0 24 24"
                      className="ml-1.5 h-3.5 w-3.5"
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
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="font-display text-xl font-semibold text-foreground/80">
                  Nothing on the calendar.
                </p>
                <p className="max-w-prose text-sm text-foreground/65">
                  Your doctor will share a booking link the moment you need one
                  — keep an eye on your email and WhatsApp.
                </p>
              </div>
            )}
          </section>

          {/* Recent prescription */}
          <section className="rounded-2xl border border-foreground/10 bg-card/45 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                Latest prescription
              </span>
              {data.prescription?.status === "active" && (
                <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
                  Active
                </span>
              )}
            </div>
            {data.prescription ? (
              <>
                <p className="mt-3 font-mono text-sm font-semibold text-foreground/95">
                  {data.prescription.prescription_code}
                </p>
                {data.prescription.follow_up_date && (
                  <p className="mt-1 text-xs text-foreground/55">
                    Follow-up{" "}
                    <span className="text-foreground/80">
                      {data.prescription.follow_up_date}
                    </span>
                  </p>
                )}
                <Link
                  href={`/prescriptions/${data.prescription.id}`}
                  className="mt-4 inline-flex h-9 items-center rounded-md border border-foreground/15 px-3 text-xs font-medium text-foreground/85 transition hover:border-foreground/30 hover:bg-foreground/[0.04]"
                >
                  View prescription →
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-foreground/65">
                No prescriptions yet — they show here as soon as your doctor
                signs one.
              </p>
            )}
          </section>

          {/* Documents */}
          <section className="rounded-2xl border border-foreground/10 bg-card/45 p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Documents
            </span>
            <p className="mt-3 max-w-prose text-sm text-foreground/80">
              Lab reports, images, anything your doctor asks for. Upload from
              the appointment page.
            </p>
            <Link
              href="/documents"
              className="mt-4 inline-flex h-9 items-center rounded-md border border-foreground/15 px-3 text-xs font-medium text-foreground/85 transition hover:border-foreground/30 hover:bg-foreground/[0.04]"
            >
              View documents →
            </Link>
          </section>
        </div>
      </main>
    </PortalShell>
  );
}
