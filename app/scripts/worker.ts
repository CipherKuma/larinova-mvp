/**
 * Larinova agent worker.
 *
 * Runs on Gabriel's 24/7 Linux box (replacing Inngest). Polls two sources:
 *
 *   1. larinova_agent_jobs              — rows inserted by webhook routes /
 *                                         app code via lib/jobs/enqueue.ts.
 *                                         Each row is dispatched to the right
 *                                         agent (intake / dispatcher /
 *                                         wellness / narrative) based on its
 *                                         `event` column.
 *
 *   2. larinova_follow_up_threads       — rows with scheduled_for <= now()
 *                                         and no outcome yet. Each triggers
 *                                         a wellness.runSend invocation.
 *
 * Run with:  pnpm tsx scripts/worker.ts
 * Or under systemd — see docs/WORKER-SETUP.md.
 */

import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({
  path: path.resolve(__dirname, "..", ".env.local"),
  override: false,
});

import { createAdminClient } from "@/lib/supabase/admin";
import * as intake from "@/lib/agents/intake";
import * as dispatcher from "@/lib/agents/dispatcher";
import * as wellness from "@/lib/agents/wellness";
import * as narrative from "@/lib/agents/narrative";
import { enqueueJob } from "@/lib/jobs/enqueue";

const POLL_INTERVAL_MS = 10_000;
const MAX_JOBS_PER_TICK = 10;
const MAX_ATTEMPTS = 3;

type AgentJob = {
  id: string;
  agent: "intake" | "dispatcher" | "wellness" | "narrative";
  event: string;
  payload: Record<string, unknown>;
  attempts: number;
};

let shuttingDown = false;

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[worker] shutdown signal received — finishing in-flight tick");
}

async function main(): Promise<void> {
  console.log(
    `[worker] started pid=${process.pid} poll=${POLL_INTERVAL_MS / 1000}s`,
  );
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (shuttingDown) break;
    try {
      await tick();
    } catch (err) {
      console.error("[worker] tick failed", err);
    }
    if (shuttingDown) break;
    await sleep(POLL_INTERVAL_MS);
  }
  console.log("[worker] bye");
  process.exit(0);
}

async function tick(): Promise<void> {
  await dispatchDueFollowUps();
  await dispatchPendingJobs();
}

async function dispatchPendingJobs(): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("larinova_agent_jobs")
    .select("id, agent, event, payload, attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(MAX_JOBS_PER_TICK);

  if (error) {
    console.error("[worker] poll failed", error);
    return;
  }
  if (!data || data.length === 0) return;

  for (const job of data as AgentJob[]) {
    await runJob(job);
  }
}

async function runJob(job: AgentJob): Promise<void> {
  const supabase = createAdminClient();

  // Claim the job — compare-and-set on status to avoid double-running if
  // multiple worker instances ever poll simultaneously.
  const { data: claimed } = await supabase
    .from("larinova_agent_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (!claimed) {
    // Another worker claimed it first.
    return;
  }

  console.log(`[worker] job ${job.id} agent=${job.agent} event=${job.event}`);
  const started = Date.now();

  try {
    const result = await dispatch(job);
    await supabase
      .from("larinova_agent_jobs")
      .update({
        status: "done",
        result,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - started,
      })
      .eq("id", job.id);
    console.log(`[worker] job ${job.id} done (${Date.now() - started}ms)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const nextAttempts = job.attempts + 1;
    const terminal = nextAttempts >= MAX_ATTEMPTS;
    await supabase
      .from("larinova_agent_jobs")
      .update({
        status: terminal ? "failed" : "pending",
        attempts: nextAttempts,
        error: msg.slice(0, 500),
        completed_at: terminal ? new Date().toISOString() : null,
      })
      .eq("id", job.id);
    console.error(
      `[worker] job ${job.id} ${terminal ? "FAILED (terminal)" : `retrying ${nextAttempts}/${MAX_ATTEMPTS}`}: ${msg}`,
    );
  }
}

async function dispatch(job: AgentJob): Promise<unknown> {
  const p = (job.payload ?? {}) as unknown;
  switch (job.event) {
    case "intake.submitted":
    case "intake.info_received":
      return intake.run(p as Parameters<typeof intake.run>[0]);
    case "consultation.finalized":
      return dispatcher.run(p as Parameters<typeof dispatcher.run>[0]);
    case "followup.scheduled":
      return wellness.runSend(p as Parameters<typeof wellness.runSend>[0]);
    case "followup.message_received":
      return wellness.runReply(p as Parameters<typeof wellness.runReply>[0]);
    case "narrative.regenerate":
      return narrative.run(p as Parameters<typeof narrative.run>[0]);
    default:
      throw new Error(`unknown job event: ${job.event}`);
  }
}

async function dispatchDueFollowUps(): Promise<void> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("larinova_follow_up_threads")
    .select("id, tier, status")
    .lte("scheduled_for", nowIso)
    .is("outcome", null)
    .eq("flagged", false)
    .in("status", ["pending", "scheduled"])
    .limit(20);

  if (error) {
    console.error("[worker] followup scan failed", error);
    return;
  }
  if (!data || data.length === 0) return;

  for (const row of data) {
    try {
      // Mark scheduled so we don't re-enqueue on the next tick before the
      // job runs. Agent will update status='active' when sending.
      await supabase
        .from("larinova_follow_up_threads")
        .update({ status: "scheduled" })
        .eq("id", row.id);

      await enqueueJob("followup.scheduled", {
        threadId: row.id,
        tier: row.tier,
      });
    } catch (err) {
      console.error("[worker] followup enqueue failed", row.id, err);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
