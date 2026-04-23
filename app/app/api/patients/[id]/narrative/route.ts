import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/patients/[id]/narrative
 *
 * Returns the doctor-facing AI narrative for a patient, plus the last-seen
 * date inferred from the most recent consultation.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: patientId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: narrative }, { data: lastConsult }] = await Promise.all([
    supabase
      .from("larinova_patient_narrative")
      .select("summary_md, generated_at, model")
      .eq("patient_id", patientId)
      .maybeSingle(),
    supabase
      .from("larinova_consultations")
      .select("start_time")
      .eq("patient_id", patientId)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    narrative: narrative?.summary_md ?? null,
    generatedAt: narrative?.generated_at ?? null,
    model: narrative?.model ?? null,
    lastSeen: lastConsult?.start_time ?? null,
  });
}
