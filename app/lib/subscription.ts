import { createClient } from "@/lib/supabase/server";
import {
  AIFeature,
  FREE_TIER_CONSULTATION_LIMIT,
  FREE_TIER_LIMITS,
  PlanType,
  Subscription,
  UsageCheck,
} from "@/types/billing";

export interface ConsultationUsageCheck {
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanType;
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

export async function checkConsultationLimit(
  doctorId: string,
  now: Date = new Date(),
): Promise<ConsultationUsageCheck> {
  const subscription = await getSubscription(doctorId);
  const plan: PlanType = subscription?.plan ?? "free";
  const status = subscription?.status ?? "active";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  if (
    plan === "pro" &&
    status === "active" &&
    periodEnd !== null &&
    periodEnd > now
  ) {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }

  const used = await getMonthlyConsultationCount(doctorId, now);
  return {
    allowed: used < FREE_TIER_CONSULTATION_LIMIT,
    used,
    limit: FREE_TIER_CONSULTATION_LIMIT,
    plan,
  };
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
  now: Date = new Date(),
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("larinova_ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("feature", feature)
    .gte("created_at", startOfMonthUtcISO(now));
  return count ?? 0;
}

export async function checkAIUsage(
  doctorId: string,
  feature: AIFeature,
  now: Date = new Date(),
): Promise<UsageCheck> {
  const subscription = await getSubscription(doctorId);
  const plan = subscription?.plan ?? "free";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  if (
    plan === "pro" &&
    subscription?.status === "active" &&
    periodEnd !== null &&
    periodEnd > now
  ) {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }

  const used = await getUsageCount(doctorId, feature, now);
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
