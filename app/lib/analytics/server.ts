import { createClient } from "@supabase/supabase-js";
import { isMissingAnalyticsStoreError } from "@/lib/analytics/errors";

export async function trackMilestone(
  event: string,
  ctx: {
    userId?: string | null;
    properties?: Record<string, unknown>;
    sessionId?: string;
    anonymousId?: string;
  } = {},
): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await sb.from("larinova_events").insert({
      session_id: ctx.sessionId ?? "server",
      anonymous_id: ctx.anonymousId ?? "server",
      user_id: ctx.userId ?? null,
      event_type: "milestone",
      element: event,
      properties: ctx.properties ?? {},
    });
    if (error && !isMissingAnalyticsStoreError(error)) {
      console.error("[trackMilestone]", event, error);
    }
  } catch (e) {
    console.error("[trackMilestone]", event, e);
    // never throw — analytics must not break the calling code path
  }
}
