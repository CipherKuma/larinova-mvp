import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getEffectivePlan(
  subscription:
    | {
        plan: string | null;
        status: string | null;
        current_period_end: string | null;
      }
    | null
    | undefined,
) {
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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id, full_name, specialization, locale")
    .eq("user_id", user.id)
    .single();

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("larinova_subscriptions")
    .select("plan, status, current_period_end")
    .eq("doctor_id", doctor.id)
    .maybeSingle();

  return NextResponse.json({
    doctor: {
      full_name: doctor.full_name,
      specialization: doctor.specialization,
      locale: doctor.locale,
    },
    plan: getEffectivePlan(subscription),
  });
}
