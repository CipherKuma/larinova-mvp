"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, CreditCard, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AIFeature, PricingRegion } from "@/types/billing";
import { FREE_TIER_CONSULTATION_LIMIT, PLAN_PRICES } from "@/types/billing";
import RazorpayCheckoutButton from "@/components/razorpay-checkout";

interface SubscriptionData {
  subscription: {
    plan: string;
    status: string;
    billing_interval?: string;
    current_period_end?: string;
  };
  usage: Record<string, { used: number; limit: number }>;
}

export default function BillingClient() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const t = useTranslations("billing");
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<PricingRegion>("default");
  const params = useParams();
  const locale = (params?.locale as string) ?? "in";

  const prices = PLAN_PRICES[region];

  const FEATURE_LABELS: Record<AIFeature, string> = {
    summary: t("featureSummary"),
    medical_codes: t("featureCodes"),
    helena_chat: t("featureChat"),
  };

  useEffect(() => {
    fetchSubscription();
    fetchRegion();
  }, []);

  const fetchRegion = async () => {
    // Prefer the URL locale as source of truth — doctors in the /id app see
    // IDR pricing, doctors in /in see INR. Falls back to geo only when the
    // locale doesn't resolve (should never happen for authed routes).
    if (locale === "in") {
      setRegion("IN");
      return;
    }
    try {
      const res = await fetch("/api/geo");
      if (res.ok) {
        const { country } = await res.json();
        if (country === "IN") setRegion("IN");
      }
    } catch {}
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 glass-card animate-pulse" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 glass-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const plan = data?.subscription?.plan ?? "free";
  const status = data?.subscription?.status ?? "active";
  const isActivePro = plan === "pro" && status === "active";
  const isPro = isActivePro;

  const consultationsUsed = data?.usage?.consultations?.used ?? 0;

  return (
    <>
      <div className="glass-card">
        {/* Header + Current Plan */}
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
                {t("billingSubscription")}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {t("manageYourPlan")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${isPro ? "bg-muted text-foreground" : "bg-secondary"}`}
              >
                {isActivePro ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {isActivePro ? t("proPlan") : t("freePlan")}
                </h2>
                {isActivePro && data?.subscription?.current_period_end && (
                  <p className="text-xs text-muted-foreground">
                    {t("renewsOn")}{" "}
                    {new Date(
                      data.subscription.current_period_end,
                    ).toLocaleDateString()}{" "}
                    &middot;{" "}
                    {data.subscription.billing_interval === "year"
                      ? prices.year.label
                      : prices.month.label}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isActivePro && (
            <div className="mt-5 pt-5 border-t border-border">
              <a
                href="mailto:hello@larinova.com?subject=Manage%20Billing"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
              >
                <CreditCard className="w-4 h-4" />
                Manage billing
              </a>
            </div>
          )}

          {!isPro && data?.usage && (
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                This month
              </h3>
              <div className="bg-secondary rounded-xl p-3 mb-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-foreground">
                    Consultations
                  </span>
                  <span className="text-muted-foreground">
                    {consultationsUsed}/{FREE_TIER_CONSULTATION_LIMIT}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      consultationsUsed >= FREE_TIER_CONSULTATION_LIMIT
                        ? "bg-destructive"
                        : "bg-foreground"
                    }`}
                    style={{
                      width: `${Math.min((consultationsUsed / FREE_TIER_CONSULTATION_LIMIT) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {t("freeTrialUsage")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  Object.entries(data.usage).filter(
                    ([key]) => key !== "consultations",
                  ) as [AIFeature, { used: number; limit: number }][]
                ).map(([feature, { used, limit }]) => (
                  <div key={feature} className="bg-secondary rounded-xl p-3">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-foreground">
                        {FEATURE_LABELS[feature]}
                      </span>
                      <span className="text-muted-foreground">
                        {used}/{limit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${used >= limit ? "bg-destructive" : "bg-foreground"}`}
                        style={{
                          width: `${Math.min((used / limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        {
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Free */}
              <div
                className={`rounded-2xl p-5 transition-all ${!isPro ? "bg-muted border-2 border-border" : "bg-secondary border border-border"}`}
              >
                <h3 className="font-bold text-lg text-foreground">Free</h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {prices.symbol}0
                </p>
                <p className="text-xs text-muted-foreground mb-5">
                  {FREE_TIER_CONSULTATION_LIMIT} consultations per month
                </p>
                <ul className="space-y-2.5 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />{" "}
                    {t("realTimeTranscription")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("patientManagement")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("aiSummariesFree")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("medCodesFree")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("medGptFree")}
                  </li>
                </ul>
                {!isPro && (
                  <div className="mt-5 py-2 text-center text-sm font-semibold text-foreground bg-muted rounded-xl">
                    {t("currentPlan")}
                  </div>
                )}
              </div>

              {/* Pro */}
              <div
                className={`rounded-2xl p-5 transition-all ${isActivePro ? "bg-muted border-2 border-border" : "bg-secondary border border-border"}`}
              >
                <h3 className="font-bold text-lg text-foreground">Pro</h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {prices.symbol}
                  {prices.month.amount / 100}
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mb-5">
                  {t("orYearlySave", {
                    label: prices.year.label,
                    savings: prices.year.savings,
                  })}
                </p>
                <ul className="space-y-2.5 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />{" "}
                    Unlimited consultations
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("everythingInFree")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("soapGeneration")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("documentGeneration")}
                  </li>
                </ul>
                {isActivePro ? (
                  <div className="mt-5 py-2 text-center text-sm font-semibold text-foreground bg-muted rounded-xl">
                    {t("currentPlan")}
                  </div>
                ) : (
                  <div className="mt-5 space-y-2">
                    <RazorpayCheckoutButton
                      interval="month"
                      label={t("subscribeMonthly", {
                        label: prices.month.label,
                      })}
                      className="w-full"
                    />
                    <RazorpayCheckoutButton
                      interval="year"
                      label={t("subscribeYearly", {
                        label: prices.year.label,
                      })}
                      variant="outline"
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl bg-secondary border border-border p-5">
                <h3 className="font-bold text-lg text-foreground">
                  {t("enterprise")}
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {t("custom")}
                </p>
                <p className="text-xs text-muted-foreground mb-5">
                  {t("forClinics")}
                </p>
                <ul className="space-y-2.5 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />{" "}
                    {t("everythingInPro")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("customIntegrations")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("dedicatedSupport")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("slaGuarantees")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{" "}
                    {t("whiteLabel")}
                  </li>
                </ul>
                <div className="mt-5">
                  <a
                    href="mailto:hello@larinova.com?subject=Enterprise%20Inquiry"
                    className="block w-full py-2.5 px-4 bg-secondary border border-border rounded-xl font-medium text-sm text-center hover:bg-muted transition-colors"
                  >
                    {t("contactUs")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </>
  );
}
