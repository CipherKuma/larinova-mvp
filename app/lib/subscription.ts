import { createClient } from "@/lib/supabase/server";
import {
  AIFeature,
  FREE_TIER_LIMITS,
  Subscription,
  UsageCheck,
} from "@/types/billing";

// India OPD pilot — 5 alpha doctors. Fill with real emails at deploy time.
// Matched case-insensitively on every login; matched doctors are upgraded to
// Pro (status='whitelisted') and receive the one-time alpha welcome email.
export const PRO_WHITELIST: readonly string[] = [
  // "dr.priya@example.com",
];

export function emailInList(email: string, list: readonly string[]): boolean {
  const needle = email.trim().toLowerCase();
  return list.some((e) => e.trim().toLowerCase() === needle);
}

export function isWhitelisted(email: string): boolean {
  return emailInList(email, PRO_WHITELIST);
}

export async function getSubscription(
  doctorId: string,
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("larinova_subscriptions")
    .select("*")
    .eq("doctor_id", doctorId)
    .single();
  return data as Subscription | null;
}

export function startOfMonthUtcISO(now: Date = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  return d.toISOString();
}

export async function getMonthlyConsultationCount(
  doctorId: string,
  now: Date = new Date(),
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("larinova_consultations")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .gte("created_at", startOfMonthUtcISO(now));
  return count ?? 0;
}

export async function getUsageCount(
  doctorId: string,
  feature: AIFeature,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("larinova_ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("feature", feature);
  return count ?? 0;
}

export async function checkAIUsage(
  doctorId: string,
  feature: AIFeature,
): Promise<UsageCheck> {
  const subscription = await getSubscription(doctorId);
  const plan = subscription?.plan ?? "free";

  if (plan === "pro" && subscription?.status === "active") {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }

  const used = await getUsageCount(doctorId, feature);
  const limit = FREE_TIER_LIMITS[feature];

  return {
    allowed: used < limit,
    used,
    limit,
    plan,
  };
}

export async function recordAIUsage(
  doctorId: string,
  feature: AIFeature,
  consultationId?: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("larinova_ai_usage").insert({
    doctor_id: doctorId,
    feature,
    consultation_id: consultationId ?? null,
  });
}
