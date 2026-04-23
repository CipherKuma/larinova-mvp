import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Insert a larinova_agent_jobs row capturing the inputs + outputs of an agent
 * step. We insert BEFORE the step starts so failures mid-step still leave a
 * row; the update at the end fills in result/tokens/cost. The `step.run` in
 * Inngest retries on throw, so we key on (agent, correlationId, step) to keep
 * idempotency — duplicates are rare enough that we don't bother.
 */

export type AgentName = "intake" | "dispatcher" | "wellness" | "narrative";
export type AgentStatus = "running" | "succeeded" | "failed";

export interface AgentJobInput {
  agent: AgentName;
  step: string;
  event: string;
  correlationId?: string;
  payload?: unknown;
  patientId?: string | null;
  locale?: "in" | "id";
}

export interface AgentJobResult {
  status: AgentStatus;
  result?: unknown;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  costCents?: number;
  error?: string;
}

/**
 * Record an agent step run. Returns the inserted job id. Call `finishAgentJob`
 * after the step completes (or fails) to record the final state.
 */
export async function startAgentJob(input: AgentJobInput): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("larinova_agent_jobs")
    .insert({
      agent: input.agent,
      step: input.step,
      event: input.event,
      correlation_id: input.correlationId ?? null,
      payload: input.payload ?? null,
      patient_id: input.patientId ?? null,
      locale: input.locale ?? "in",
      status: "running",
      started_at: new Date().toISOString(),
      attempts: 1,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `startAgentJob failed: ${error?.message ?? "unknown error"}`,
    );
  }
  return data.id as string;
}

export async function finishAgentJob(
  jobId: string,
  result: AgentJobResult,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("larinova_agent_jobs")
    .update({
      status: result.status,
      result: result.result ?? null,
      model: result.model ?? null,
      tokens_input: result.tokensInput ?? null,
      tokens_output: result.tokensOutput ?? null,
      cost_cents: result.costCents ?? null,
      last_error: result.error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/**
 * Convenience wrapper: start a job row, run the body, finish with the result
 * (or error state). If the body throws, the row is marked 'failed' and the
 * error re-thrown so Inngest can retry the step.
 */
export async function runAgentStep<T>(
  input: AgentJobInput,
  body: () => Promise<{ result: T; model?: string }>,
): Promise<T> {
  const jobId = await startAgentJob(input);
  try {
    const out = await body();
    await finishAgentJob(jobId, {
      status: "succeeded",
      result: out.result as unknown,
      model: out.model,
    });
    return out.result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await finishAgentJob(jobId, { status: "failed", error: msg });
    throw err;
  }
}
