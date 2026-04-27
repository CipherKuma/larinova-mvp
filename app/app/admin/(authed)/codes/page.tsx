import { createClient as createServiceClient } from "@supabase/supabase-js";
import { InviteDoctorModal } from "./InviteDoctorModal";

export const dynamic = "force-dynamic";

// Service-role read. larinova_invite_codes has RLS enabled with no SELECT
// policy, so the user-JWT client returns nothing — even for an admin.
// The /admin/(authed) layout gates this page on requireAdmin() before we
// get here, so the privileged read is authorized.
async function fetchCodes() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: codes } = await supabase
    .from("larinova_invite_codes")
    .select(
      "code, note, first_name, last_name, email, created_at, redeemed_by, redeemed_at",
    )
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
        <h1 className="text-2xl font-semibold">Invitations</h1>
        <InviteDoctorModal />
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Invitee</th>
              <th className="px-4 py-2 font-medium">Sent</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Joined as</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => {
              const inviteeName =
                c.first_name || c.last_name
                  ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                  : (c.note ?? "—");
              return (
                <tr key={c.code} className="border-t border-border">
                  <td className="px-4 py-2">
                    <div className="text-foreground">{inviteeName}</div>
                    {c.email && (
                      <div className="text-xs text-muted-foreground">
                        {c.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {c.redeemed_at ? (
                      <span className="text-emerald-500">Accepted</span>
                    ) : (
                      <span className="text-muted-foreground">Sent</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {c.redeemer
                      ? `${c.redeemer.full_name} (${c.redeemer.email})`
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {codes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No invitations sent yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
