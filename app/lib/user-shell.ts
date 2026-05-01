import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserShellDoctor {
  full_name: string | null;
  specialization: string | null;
  locale: string | null;
}

export interface UserShellData {
  doctor: UserShellDoctor;
  plan: "free" | "pro";
}

function getEffectivePlan(
  subscription:
    | {
        plan: string | null;
        status: string | null;
        current_period_end: string | null;
      }
    | null
    | undefined,
): "free" | "pro" {
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const isPro =
    subscription?.plan === "pro" &&
    subscription?.status === "active" &&
    periodEnd !== null &&
    periodEnd > new Date();

  return isPro ? "pro" : "free";
}

export async function getUserShellData(
  supabase: SupabaseClient,
): Promise<UserShellData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id, full_name, specialization, locale")
    .eq("user_id", user.id)
    .single();

  if (!doctor) return null;

  const { data: subscription } = await supabase
    .from("larinova_subscriptions")
    .select("plan, status, current_period_end")
    .eq("doctor_id", doctor.id)
    .maybeSingle();

  return {
    doctor: {
      full_name: doctor.full_name,
      specialization: doctor.specialization,
      locale: doctor.locale,
    },
    plan: getEffectivePlan(subscription),
  };
}
