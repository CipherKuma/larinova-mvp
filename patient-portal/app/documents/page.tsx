import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

export const dynamic = "force-dynamic";

type PatientDocument = {
  id: string;
  original_filename: string | null;
  uploaded_at: string | null;
  kind: string | null;
  uploader: string | null;
  mime_type: string | null;
};

type AgentJob = {
  id: string;
  status: string;
  created_at: string;
  payload: { description?: string } | null;
};

function fileGlyph(mime: string | null, kind: string | null) {
  const m = (mime ?? "").toLowerCase();
  const k = (kind ?? "").toLowerCase();
  if (m.startsWith("image/") || k === "image") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    );
  }
  if (m === "application/pdf" || k === "lab_report") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

function kindLabel(kind: string | null): string {
  if (!kind) return "Document";
  const map: Record<string, string> = {
    lab_report: "Lab report",
    image: "Image",
    prescription: "Prescription",
    referral: "Referral",
    note: "Note",
  };
  return (
    map[kind] ??
    kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DocumentsPage() {
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

  let uploads: PatientDocument[] = [];
  let pending: AgentJob[] = [];

  if (patient?.id) {
    try {
      const { data } = await supabase
        .from("larinova_patient_documents")
        .select("id, original_filename, uploaded_at, kind, uploader, mime_type")
        .eq("patient_id", patient.id)
        .order("uploaded_at", { ascending: false })
        .limit(50);
      uploads = (data ?? []) as PatientDocument[];
    } catch {
      uploads = [];
    }

    try {
      const { data } = await supabase
        .from("larinova_agent_jobs")
        .select("id, status, created_at, payload")
        .eq("patient_id", patient.id)
        .eq("event", "document_request")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);
      pending = (data ?? []) as AgentJob[];
    } catch {
      pending = [];
    }
  }

  return (
    <PortalShell email={user.email} name={patient?.full_name ?? null}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-5 py-8 md:px-8 md:py-12">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85">
            Documents
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Everything you&apos;ve shared
          </h1>
          <p className="max-w-prose text-sm text-foreground/65">
            Lab reports, scans, photos — anything your doctor asks for. We keep
            them grouped here, and your doctor can pull them up the moment you
            walk in.
          </p>
        </div>

        {pending.length > 0 && (
          <section className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.05] p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </span>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-300">
                Doctor is waiting on
              </h2>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/85">
              {pending.map((p) => (
                <li key={p.id} className="flex items-baseline gap-2">
                  <span className="text-amber-300/70">•</span>
                  <span>{p.payload?.description ?? "Additional document"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-foreground/55">
              Open the related appointment to upload.
            </p>
          </section>
        )}

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/55">
              Your uploads
            </h2>
            {uploads.length > 0 && (
              <span className="font-mono text-[11px] tracking-wide text-foreground/45">
                {uploads.length} {uploads.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>

          {uploads.length > 0 ? (
            <ul className="mt-3 divide-y divide-foreground/8 overflow-hidden rounded-2xl border border-foreground/10 bg-card/40">
              {uploads.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-foreground/[0.02]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {fileGlyph(d.mime_type, d.kind)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground/90">
                      {d.original_filename ?? "Document"}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-foreground/45">
                      {kindLabel(d.kind)} · {formatDate(d.uploaded_at)}
                      {d.uploader === "patient"
                        ? ""
                        : d.uploader
                          ? ` · from ${d.uploader}`
                          : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-foreground/15 bg-card/30 p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <p className="mt-3 font-display text-base font-semibold text-foreground/85">
                Nothing here yet.
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/60">
                Open an upcoming appointment to upload a lab report, scan, or
                photo your doctor asked about.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex h-10 items-center rounded-lg border border-foreground/15 px-4 text-sm font-medium text-foreground/85 transition hover:border-foreground/30 hover:bg-foreground/[0.04]"
              >
                Go to your appointment
              </Link>
            </div>
          )}
        </section>
      </main>
    </PortalShell>
  );
}
