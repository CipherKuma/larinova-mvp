"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Issue = {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  created_at: string;
  larinova_doctors:
    | { full_name: string; email: string }
    | { full_name: string; email: string }[];
};
type Message = {
  id: string;
  sender_role: "doctor" | "admin";
  body: string;
  created_at: string;
};

function doctorOf(i: Issue): { full_name: string; email: string } | null {
  const d = i.larinova_doctors;
  return Array.isArray(d) ? (d[0] ?? null) : (d ?? null);
}

export default function AdminIssueDetail() {
  const params = useParams();
  const id = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/issues/${id}`).then((r) => r.json());
    setIssue(r.issue);
    setMessages(r.messages);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    await fetch(`/api/admin/issues/${id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: draft.trim() }),
    });
    setDraft("");
    await load();
    setSending(false);
  }

  async function setStatus(status: string) {
    await fetch(`/api/admin/issues/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (!issue) return <div>Loading…</div>;
  const d = doctorOf(issue);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{issue.title}</h1>
        <div className="text-xs text-muted-foreground mt-1">
          From {d?.full_name ?? "—"} ({d?.email ?? "—"}) ·{" "}
          {new Date(issue.created_at).toLocaleString()}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["open", "in_progress", "resolved", "wont_fix"] as const).map(
            (s) => (
              <Button
                key={s}
                variant={issue.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ),
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Original report
        </div>
        <div className="whitespace-pre-wrap text-sm">{issue.body}</div>
      </div>

      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              "flex " +
              (m.sender_role === "admin" ? "justify-end" : "justify-start")
            }
          >
            <div
              className={
                "max-w-[80%] rounded-lg p-3 text-sm " +
                (m.sender_role === "admin"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground border border-border rounded-bl-sm")
              }
            >
              <div className="text-[10px] uppercase tracking-widest mb-1 opacity-70">
                {m.sender_role === "admin" ? "You (Admin)" : "Doctor"}
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
              <div className="text-[10px] opacity-60 mt-1">
                {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <div className="relative flex flex-col rounded-md border border-input bg-card shadow-sm">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={3}
            placeholder="Reply to doctor…"
            className="resize-none border-0 bg-transparent px-4 pt-3 pb-12 text-sm focus-visible:outline-none"
          />
          <Button
            type="button"
            onClick={send}
            disabled={sending || !draft.trim()}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-md p-0"
          >
            ↑
          </Button>
        </div>
      </div>
    </div>
  );
}
