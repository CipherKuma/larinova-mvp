import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMonthlyConsultationCount,
  getSubscription,
  getUsageCount,
} from "@/lib/subscription";
import {
  AIFeature,
  FREE_TIER_CONSULTATION_LIMIT,
  FREE_TIER_LIMITS,
} from "@/types/billing";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const subscription = await getSubscription(doctor.id);

    // Pro is only "real" while it's active AND current_period_end is in the
    // future — same rule as checkConsultationLimit / checkAIUsage. Without
    // this, expired-Pro users see "Pro Plan" in the UI but get blocked at
    // the 21st consultation.
    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const now = new Date();
    const isPro =
      subscription?.plan === "pro" &&
      subscription?.status === "active" &&
      periodEnd !== null &&
      periodEnd > now;

    const features: AIFeature[] = ["summary", "medical_codes", "helena_chat"];
    const usage: Record<string, { used: number; limit: number }> = {};

    for (const feature of features) {
      const used = await getUsageCount(doctor.id, feature);
      usage[feature] = {
        used,
        limit: isPro ? Infinity : FREE_TIER_LIMITS[feature],
      };
    }

    const consultationsUsed = await getMonthlyConsultationCount(doctor.id);
    usage.consultations = {
      used: consultationsUsed,
      limit: isPro ? Infinity : FREE_TIER_CONSULTATION_LIMIT,
    };

    // Override the surfaced subscription so the UI reflects effective tier
    // (an expired Pro renders as Free without lying about renewal date).
    const effectiveSubscription = subscription
      ? { ...subscription, plan: isPro ? subscription.plan : "free" }
      : { plan: "free", status: "active" };

    return NextResponse.json({
      subscription: effectiveSubscription,
      usage,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}
