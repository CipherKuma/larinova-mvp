import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AdminIssueRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  doctor_id: string;
  larinova_doctors:
    | { full_name: string; email: string }
    | { full_name: string; email: string }[];
};

function doctorOf(i: AdminIssueRow) {
  const d = i.larinova_doctors;
  return Array.isArray(d) ? d[0] : d;
}

export default async function AdminIssuesPage() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: issues } = await sb
    .from("larinova_issues")
    .select(
      "id, title, status, priority, created_at, updated_at, doctor_id, larinova_doctors!inner(full_name, email)",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Issues</h1>
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Reporter</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {((issues ?? []) as AdminIssueRow[]).map((i) => {
              const d = doctorOf(i);
              return (
                <tr
                  key={i.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-2">
                    <Link
                      className="hover:underline"
                      href={`/admin/issues/${i.id}`}
                    >
                      {i.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {d?.full_name ?? "—"} {d?.email ? `(${d.email})` : ""}
                  </td>
                  <td className="px-4 py-2">{i.status}</td>
                  <td className="px-4 py-2">{i.priority}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {new Date(i.updated_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {(!issues || issues.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No issues yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
