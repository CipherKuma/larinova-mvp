import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";
import PdfDownload from "./PdfDownload";

export const dynamic = "force-dynamic";

type PrescriptionItem = {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

function statusBadge(status: string) {
  const map: Record<string, { dot: string; text: string; label: string }> = {
    active: {
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      label: "Active",
    },
    completed: {
      dot: "bg-foreground/40",
      text: "text-foreground/65",
      label: "Completed",
    },
    cancelled: { dot: "bg-red-400", text: "text-red-300", label: "Cancelled" },
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
        className={`h-1.5 w-1.5 rounded-full ${m.dot} ${status === "active" ? "animate-pulse" : ""}`}
      />
      {m.label}
    </span>
  );
}

export default async function PrescriptionPage({
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
    .select("id, full_name")
    .eq("email", user.email)
    .maybeSingle();

  const { data: rx } = await supabase
    .from("larinova_prescriptions")
    .select(
      "id, prescription_code, doctor_notes, follow_up_date, status, created_at, patient_id, diagnosis, doctor_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!rx) notFound();
  if (patient?.id && rx.patient_id !== patient.id) notFound();

  const { data: items } = await supabase
    .from("larinova_prescription_items")
    .select("id, medicine_name, dosage, frequency, duration, instructions")
    .eq("prescription_id", rx.id);

  const { data: doctor } = rx.doctor_id
    ? await supabase
        .from("larinova_doctors")
        .select("full_name, specialization")
        .eq("id", rx.doctor_id)
        .maybeSingle()
    : { data: null };

  const issued = new Date(rx.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PortalShell email={user.email} name={patient?.full_name ?? null}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 md:px-8 md:py-12">
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

        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-gradient-to-br from-card/85 to-card/40 p-5 md:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/12 blur-3xl"
          />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85">
                Prescription · {rx.prescription_code}
              </p>
              <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
                Your medications
              </h1>
              {doctor?.full_name && (
                <p className="text-sm text-foreground/70">
                  Signed by{" "}
                  <span className="font-medium text-foreground/90">
                    Dr. {doctor.full_name}
                  </span>
                  {doctor.specialization &&
                  doctor.specialization !== "Not Specified" ? (
                    <span className="text-foreground/50">
                      {" "}
                      · {doctor.specialization}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
            {statusBadge(rx.status)}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/55">
            <span>
              Issued{" "}
              <span className="text-foreground/85 normal-case tracking-normal">
                {issued}
              </span>
            </span>
            {rx.follow_up_date && (
              <span>
                Follow-up{" "}
                <span className="text-foreground/85 normal-case tracking-normal">
                  {rx.follow_up_date}
                </span>
              </span>
            )}
          </div>
        </header>

        {/* Diagnosis */}
        {rx.diagnosis && (
          <section className="rounded-2xl border border-foreground/10 bg-card/45 p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Diagnosis
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
              {rx.diagnosis}
            </p>
          </section>
        )}

        {/* Medication list */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            Medications · {items?.length ?? 0}
          </h2>
          {items && items.length > 0 ? (
            <ul className="space-y-3">
              {(items as PrescriptionItem[]).map((it, idx) => (
                <li
                  key={it.id}
                  className="rounded-2xl border border-foreground/10 bg-card/45 p-5 transition hover:border-foreground/20"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <rect
                          x="3"
                          y="9"
                          width="18"
                          height="6"
                          rx="3"
                          transform="rotate(-30 12 12)"
                        />
                        <path d="M9.7 7.5 14.5 16" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-display text-lg font-semibold leading-tight">
                          {it.medicine_name}
                        </p>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-foreground/40">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <span className="text-foreground/45">
                          Dosage{" "}
                          <span className="ml-1 font-medium text-foreground/85">
                            {it.dosage}
                          </span>
                        </span>
                        <span className="text-foreground/45">
                          When{" "}
                          <span className="ml-1 font-medium text-foreground/85">
                            {it.frequency}
                          </span>
                        </span>
                        <span className="text-foreground/45">
                          For{" "}
                          <span className="ml-1 font-medium text-foreground/85">
                            {it.duration}
                          </span>
                        </span>
                      </div>
                      {it.instructions && (
                        <p className="mt-3 rounded-lg border border-foreground/8 bg-foreground/[0.03] px-3 py-2 text-xs leading-relaxed text-foreground/65">
                          {it.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-foreground/10 bg-card/40 p-5 text-sm text-foreground/65">
              No medication items on this prescription.
            </p>
          )}
        </section>

        {/* Doctor notes */}
        {rx.doctor_notes && (
          <section className="rounded-2xl border border-foreground/10 bg-card/45 p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Doctor&apos;s notes
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {rx.doctor_notes}
            </p>
          </section>
        )}

        <PdfDownload prescriptionId={rx.id} />
      </main>
    </PortalShell>
  );
}
