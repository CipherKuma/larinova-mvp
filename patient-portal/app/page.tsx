import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatApptTime, loadHomeData } from "@/lib/data/home";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const data = await loadHomeData(supabase, user.email);

  return (
    <>
      <PortalHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>

        <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Upcoming appointment
          </h2>
          {data.upcoming ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {formatApptTime(data.upcoming)}
              </p>
              <p className="text-base text-foreground/70">
                {data.upcoming.type === "video"
                  ? "Video consultation"
                  : "In-person visit"}
              </p>
              {data.upcoming.reason && (
                <p className="text-sm text-foreground/60">
                  Reason: {data.upcoming.reason}
                </p>
              )}
              <Link
                href={`/appointments/${data.upcoming.id}`}
                className="inline-flex h-11 items-center rounded-lg bg-foreground px-5 text-sm font-medium text-background"
              >
                Manage appointment
              </Link>
            </div>
          ) : (
            <p className="text-base text-foreground/70">
              No upcoming appointments. Your doctor will share a booking link
              when you need one.
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Most recent prescription
          </h2>
          {data.prescription ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {data.prescription.prescription_code}
              </p>
              <p className="text-sm text-foreground/70">
                Status: {data.prescription.status}
                {data.prescription.follow_up_date
                  ? ` · Follow-up ${data.prescription.follow_up_date}`
                  : ""}
              </p>
              <Link
                href={`/prescriptions/${data.prescription.id}`}
                className="inline-flex h-11 items-center rounded-lg border border-foreground/15 px-5 text-sm font-medium"
              >
                View prescription
              </Link>
            </div>
          ) : (
            <p className="text-base text-foreground/70">
              No prescriptions yet.
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Documents
          </h2>
          <p className="text-base text-foreground/70">
            Upload lab reports, images, or prescriptions your doctor asked for.
          </p>
          <Link
            href="/documents"
            className="inline-flex h-11 items-center rounded-lg border border-foreground/15 px-5 text-sm font-medium"
          >
            View documents
          </Link>
        </section>
      </main>
    </>
  );
}
