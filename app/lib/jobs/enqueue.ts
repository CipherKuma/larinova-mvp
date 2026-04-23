import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Job queue helper — inserts a row into `larinova_agent_jobs` with
 * status='pending'. The out-of-process worker (`scripts/worker.ts`) polls this
 * table on the Linux box and dispatches each job to the correct agent.
 *
 * This replaced the previous Inngest-based orchestration. Durable waits and
 * scheduled sleeps are now the worker's responsibility (it scans
 * `larinova_follow_up_threads.scheduled_for` for due items).
 */

export type JobType =
  | "intake.submitted"
  | "intake.info_received"
  | "consultation.finalized"
  | "followup.scheduled"
  | "followup.message_received"
  | "narrative.regenerate";

const AGENT_FOR: Record<
  JobType,
  "intake" | "dispatcher" | "wellness" | "narrative"
> = {
  "intake.submitted": "intake",
  "intake.info_received": "intake",
  "consultation.finalized": "dispatcher",
  "followup.scheduled": "wellness",
  "followup.message_received": "wellness",
  "narrative.regenerate": "narrative",
};

export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown>,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("larinova_agent_jobs")
    .insert({
      agent: AGENT_FOR[type],
      event: type,
      payload,
      status: "pending",
      attempts: 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`enqueueJob failed: ${error?.message ?? "unknown error"}`);
  }
  return data.id as string;
}
