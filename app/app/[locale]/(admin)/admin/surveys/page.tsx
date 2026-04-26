import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";
import type { SurveyRow } from "./types";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const supabase = await createClient();
  const { data: surveys } = await supabase
    .from("larinova_discovery_surveys")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <a
          className="text-sm underline text-muted-foreground hover:text-foreground"
          href="/api/admin/surveys/export"
        >
          Export CSV
        </a>
      </div>
      <AdminDashboard responses={(surveys as SurveyRow[]) ?? []} />
    </div>
  );
}
