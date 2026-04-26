import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function SessionTimeline({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await sb
    .from("larinova_events")
    .select("ts, event_type, path, raw_path, element, properties, user_id")
    .eq("session_id", id)
    .order("ts", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Session timeline</h1>
      <p className="text-sm text-muted-foreground mb-6 font-mono">{id}</p>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">Path</th>
              <th className="px-4 py-2 font-medium">Element / details</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-2 text-xs font-mono text-muted-foreground">
                  {new Date(e.ts).toLocaleTimeString()}
                </td>
                <td className="px-4 py-2 uppercase tracking-wider text-xs">
                  {e.event_type}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{e.path ?? "—"}</td>
                <td className="px-4 py-2 text-xs">
                  {e.element ?? ""}
                  {e.properties && Object.keys(e.properties).length > 0 && (
                    <pre className="text-[10px] mt-1 text-muted-foreground">
                      {JSON.stringify(e.properties)}
                    </pre>
                  )}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No events for this session.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
