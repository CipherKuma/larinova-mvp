import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { InviteDoctorModal } from "../codes/InviteDoctorModal";
import { CopyInviteCodeButton } from "./CopyInviteCodeButton";

export const dynamic = "force-dynamic";

type DoctorRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  locale: string | null;
  created_at: string;
  onboarding_completed: boolean | null;
};

type InviteRow = {
  code: string;
  note: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
};

type SubscriptionRow = {
  doctor_id: string;
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
};

type AdminDoctorRow = {
  key: string;
  doctorId: string | null;
  name: string;
  email: string | null;
  locale: string | null;
  inviteCode: string | null;
  status: "Sent" | "Joined";
  sentAt: string | null;
  joinedAt: string | null;
  onboardingCompleted: boolean;
  subscription: SubscriptionRow | null;
  consultations: number;
};

async function fetchDoctorRows(): Promise<AdminDoctorRow[]> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const [{ data: doctors }, { data: invitations }] = await Promise.all([
    supabase
      .from("larinova_doctors")
      .select(
        "id, user_id, full_name, email, locale, created_at, onboarding_completed",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("larinova_invite_codes")
      .select(
        "code, note, first_name, last_name, email, created_at, redeemed_by, redeemed_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const doctorRows = (doctors ?? []) as DoctorRow[];
  const inviteRows = (invitations ?? []) as InviteRow[];
  const doctorIds = doctorRows.map((d) => d.id);
  const doctorByUserId = new Map(
    doctorRows
      .filter((d) => d.user_id)
      .map((d) => [d.user_id as string, d]),
  );
  const invitedUserIds = new Set(
    inviteRows.map((i) => i.redeemed_by).filter(Boolean) as string[],
  );

  const [subsRes, countsRes] =
    doctorIds.length > 0
      ? await Promise.all([
          supabase
            .from("larinova_subscriptions")
            .select("doctor_id, plan, status, current_period_end")
            .in("doctor_id", doctorIds),
          supabase
            .from("larinova_consultations")
            .select("doctor_id")
            .in("doctor_id", doctorIds),
        ])
      : [{ data: [] }, { data: [] }];

  const subMap = new Map(
    ((subsRes.data ?? []) as SubscriptionRow[]).map((s) => [s.doctor_id, s]),
  );
  const countMap = new Map<string, number>();
  for (const c of (countsRes.data ?? []) as { doctor_id: string }[]) {
    countMap.set(c.doctor_id, (countMap.get(c.doctor_id) ?? 0) + 1);
  }

  const rows: AdminDoctorRow[] = inviteRows.map((invite) => {
    const joinedDoctor = invite.redeemed_by
      ? (doctorByUserId.get(invite.redeemed_by) ?? null)
      : null;
    const inviteeName =
      invite.first_name || invite.last_name
        ? `${invite.first_name ?? ""} ${invite.last_name ?? ""}`.trim()
        : (invite.note ?? "Invited doctor");

    return {
      key: `invite:${invite.code}`,
      doctorId: joinedDoctor?.id ?? null,
      name: joinedDoctor?.full_name ?? inviteeName,
      email: joinedDoctor?.email ?? invite.email,
      locale: joinedDoctor?.locale ?? null,
      inviteCode: invite.code,
      status: invite.redeemed_at || joinedDoctor ? "Joined" : "Sent",
      sentAt: invite.created_at,
      joinedAt: joinedDoctor?.created_at ?? invite.redeemed_at,
      onboardingCompleted: Boolean(joinedDoctor?.onboarding_completed),
      subscription: joinedDoctor ? (subMap.get(joinedDoctor.id) ?? null) : null,
      consultations: joinedDoctor ? (countMap.get(joinedDoctor.id) ?? 0) : 0,
    };
  });

  for (const doctor of doctorRows) {
    if (doctor.user_id && invitedUserIds.has(doctor.user_id)) continue;
    rows.push({
      key: `doctor:${doctor.id}`,
      doctorId: doctor.id,
      name: doctor.full_name,
      email: doctor.email,
      locale: doctor.locale,
      inviteCode: null,
      status: "Joined",
      sentAt: null,
      joinedAt: doctor.created_at,
      onboardingCompleted: Boolean(doctor.onboarding_completed),
      subscription: subMap.get(doctor.id) ?? null,
      consultations: countMap.get(doctor.id) ?? 0,
    });
  }

  return rows.sort((a, b) => {
    const aTime = new Date(a.sentAt ?? a.joinedAt ?? 0).getTime();
    const bTime = new Date(b.sentAt ?? b.joinedAt ?? 0).getTime();
    return bTime - aTime;
  });
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default async function DoctorsPage() {
  const rows = await fetchDoctorRows();

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Doctors</h1>
        <InviteDoctorModal />
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Doctor</th>
              <th className="px-4 py-2 font-medium">Invite code</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Onboarded</th>
              <th className="px-4 py-2 font-medium">Consults</th>
              <th className="px-4 py-2 font-medium">Sent</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-t border-border hover:bg-muted/30"
              >
                <td className="px-4 py-2">
                  {row.doctorId ? (
                    <Link
                      className="hover:underline"
                      href={`/admin/doctors/${row.doctorId}`}
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span>{row.name}</span>
                  )}
                  {row.email && (
                    <div className="text-xs text-muted-foreground">
                      {row.email}
                    </div>
                  )}
                  {row.locale && (
                    <div className="text-xs uppercase text-muted-foreground">
                      {row.locale}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {row.inviteCode ? (
                    <div className="flex items-center gap-1.5">
                      <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                        {row.inviteCode}
                      </code>
                      <CopyInviteCodeButton code={row.inviteCode} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Badge
                    variant={row.status === "Joined" ? "default" : "outline"}
                    className={
                      row.status === "Joined"
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : undefined
                    }
                  >
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  {row.subscription?.plan ?? (row.doctorId ? "free" : "-")}
                </td>
                <td className="px-4 py-2">
                  {row.onboardingCompleted ? "Yes" : "-"}
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {row.doctorId ? row.consultations : "-"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatDate(row.sentAt)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatDate(row.joinedAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No doctors or invitations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
