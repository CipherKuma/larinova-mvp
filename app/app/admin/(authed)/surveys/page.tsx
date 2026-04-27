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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Survey responses</h1>
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
