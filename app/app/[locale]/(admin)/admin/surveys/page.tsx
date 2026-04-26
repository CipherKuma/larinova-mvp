import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const supabase = await createClient();
  const { data: surveys } = await supabase
    .from("larinova_discovery_surveys")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Survey responses</h1>
        <a className="text-sm underline" href="/api/admin/surveys/export">
          Export CSV
        </a>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Submitted</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Specialization</th>
              <th className="px-4 py-2 font-medium">Clinic</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">WhatsApp</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Locale</th>
              <th className="px-4 py-2 font-medium">Raw</th>
            </tr>
          </thead>
          <tbody>
            {(surveys ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border align-top">
                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2">{s.name ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.specialization ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.clinic ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.city ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground font-mono text-xs">
                  {s.whatsapp ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.email ?? "—"}
                </td>
                <td className="px-4 py-2 uppercase text-xs">
                  {s.locale ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="cursor-pointer text-xs">View</summary>
                    <pre className="text-xs whitespace-pre-wrap mt-2">
                      {JSON.stringify(s, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {(!surveys || surveys.length === 0) && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No responses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
