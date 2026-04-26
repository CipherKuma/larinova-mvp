import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MyIssuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: issues } = await supabase
    .from("larinova_issues")
    .select("id, title, status, priority, created_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold truncate">
          My issues
        </h1>
        <Link href={`/${locale}/issues/new`} className="hidden md:inline-block">
          <Button>Report new issue</Button>
        </Link>
      </div>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {(issues ?? []).map((i) => (
          <Link
            key={i.id}
            href={`/${locale}/issues/${i.id}`}
            className="flex items-center justify-between p-4 hover:bg-muted/30"
          >
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Updated {new Date(i.updated_at).toLocaleString()}
              </div>
            </div>
            <span
              className={
                "text-xs px-2 py-0.5 rounded-full " +
                (i.status === "open"
                  ? "bg-amber-500/15 text-amber-600"
                  : i.status === "in_progress"
                    ? "bg-blue-500/15 text-blue-600"
                    : i.status === "resolved"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-muted text-muted-foreground")
              }
            >
              {i.status}
            </span>
          </Link>
        ))}
        {(!issues || issues.length === 0) && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No issues yet. Use &quot;Report new issue&quot; to file one.
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        href={`/${locale}/issues/new`}
        aria-label="Report new issue"
        className="md:hidden fixed z-40 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        <span className="text-2xl leading-none">+</span>
      </Link>
    </div>
  );
}
