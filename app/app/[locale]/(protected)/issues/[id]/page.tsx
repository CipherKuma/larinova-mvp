import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IssueChat } from "../IssueChat";

export const dynamic = "force-dynamic";

export default async function IssueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: issue } = await supabase
    .from("larinova_issues")
    .select("id, title, body, status, priority, created_at, resolved_at")
    .eq("id", id)
    .maybeSingle();
  if (!issue) notFound();

  const { data: messages } = await supabase
    .from("larinova_issue_messages")
    .select("id, sender_role, body, created_at")
    .eq("issue_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">{issue.title}</h1>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(issue.created_at).toLocaleString()} · status: {issue.status}{" "}
          · priority: {issue.priority}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Original report
        </div>
        <div className="whitespace-pre-wrap text-sm">{issue.body}</div>
      </div>
      <IssueChat
        issueId={issue.id}
        initial={(messages ?? []) as Parameters<typeof IssueChat>[0]["initial"]}
      />
    </div>
  );
}
