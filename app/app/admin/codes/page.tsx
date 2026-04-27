import { createClient } from "@/lib/supabase/server";
import { CodeGenerateModal } from "./CodeGenerateModal";
import { InviteDoctorModal } from "./InviteDoctorModal";

export const dynamic = "force-dynamic";

async function fetchCodes() {
  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("larinova_invite_codes")
    .select("code, note, created_at, redeemed_by, redeemed_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!codes || codes.length === 0) return [];

  const redeemerIds = codes
    .map((c) => c.redeemed_by)
    .filter(Boolean) as string[];
  const doctorMap = new Map<string, { full_name: string; email: string }>();
  if (redeemerIds.length > 0) {
    const { data: doctors } = await supabase
      .from("larinova_doctors")
      .select("user_id, full_name, email")
      .in("user_id", redeemerIds);
    for (const d of doctors ?? []) {
      doctorMap.set(d.user_id, { full_name: d.full_name, email: d.email });
    }
  }

  return codes.map((c) => ({
    ...c,
    redeemer: c.redeemed_by ? (doctorMap.get(c.redeemed_by) ?? null) : null,
  }));
}

export default async function CodesPage() {
  const codes = await fetchCodes();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Invite codes</h1>
        <div className="flex items-center gap-2">
          <CodeGenerateModal />
          <InviteDoctorModal />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Note</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Redeemed by</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code} className="border-t border-border">
                <td className="px-4 py-2 font-mono">{c.code}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {c.note ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {c.redeemed_at ? (
                    <span className="text-emerald-500">Redeemed</span>
                  ) : (
                    <span className="text-muted-foreground">Open</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {c.redeemer
                    ? `${c.redeemer.full_name} (${c.redeemer.email})`
                    : "—"}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
