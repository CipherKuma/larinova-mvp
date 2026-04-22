import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

type PatientDocument = {
  id: string;
  file_name: string;
  created_at: string;
  status?: string | null;
  source?: string | null;
};

type AgentJob = {
  id: string;
  description: string | null;
  status: string;
  created_at: string;
};

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: patient } = await supabase
    .from("larinova_patients")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  let uploads: PatientDocument[] = [];
  let pending: AgentJob[] = [];

  if (patient?.id) {
    // Team NotifyAgents owns `larinova_patient_documents` — if it doesn't
    // exist yet, fail soft.
    try {
      const { data } = await supabase
        .from("larinova_patient_documents")
        .select("id, file_name, created_at, status, source")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(50);
      uploads = (data ?? []) as PatientDocument[];
    } catch {
      uploads = [];
    }

    try {
      const { data } = await supabase
        .from("larinova_agent_jobs")
        .select("id, description, status, created_at")
        .eq("patient_id", patient.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);
      pending = (data ?? []) as AgentJob[];
    } catch {
      pending = [];
    }
  }

  return (
    <>
      <PortalHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-foreground/70">
            Everything you&apos;ve shared with your doctor.
          </p>
        </div>

        {pending.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="text-sm font-medium uppercase tracking-wide text-amber-500">
              Requested by your doctor
            </h2>
            <ul className="space-y-2 text-base">
              {pending.map((p) => (
                <li key={p.id}>{p.description ?? "Additional document"}</li>
              ))}
            </ul>
            <p className="text-sm text-foreground/70">
              Upload via the linked appointment page.
            </p>
          </section>
        )}

        <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Your uploads
          </h2>
          {uploads.length > 0 ? (
            <ul className="divide-y divide-foreground/10">
              {uploads.map((d) => (
                <li
                  key={d.id}
                  className="flex items-baseline justify-between py-3"
                >
                  <span className="text-base">{d.file_name}</span>
                  <span className="text-xs text-foreground/50">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-foreground/70">
              No uploads yet. Open an appointment to attach a document.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
