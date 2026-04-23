"use client";

import { useState, useEffect } from "react";
import { Zap, X, Loader2 } from "lucide-react";
import Script from "next/script";
import { useTranslations } from "next-intl";
import type { AIFeature, PricingRegion } from "@/types/billing";
import { PLAN_PRICES } from "@/types/billing";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UpgradeModalProps {
  feature: AIFeature;
  used: number;
  limit: number;
  onClose: () => void;
}

export function UpgradeModal({
  feature,
  used,
  limit,
  onClose,
}: UpgradeModalProps) {
  const t = useTranslations("upgradeModal");
  const tb = useTranslations("billing");
  const [loading, setLoading] = useState<string | null>(null);
  const [region, setRegion] = useState<PricingRegion>("default");
  const prices = PLAN_PRICES[region];

  const FEATURE_NAMES: Record<AIFeature, string> = {
    summary: tb("featureSummary"),
    medical_codes: tb("featureCodes"),
    helena_chat: tb("featureChat"),
  };

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then(({ country }) => {
        if (country === "IN") setRegion("IN");
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (interval: "month" | "year") => {
    setLoading(interval);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, region }),
      });
      const { subscription_id, key_id, doctor_name, email } = await res.json();

      if (!subscription_id) return;

      const options = {
        key: key_id,
        subscription_id,
        name: "Larinova",
        description: `Pro Plan (${interval === "month" ? "Monthly" : "Yearly"})`,
        prefill: { name: doctor_name, email },
        theme: { color: "#000000" },
        handler: async (response: any) => {
          await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              interval,
            }),
          });
          onClose();
          window.location.reload();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background rounded-xl border shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Zap className="w-6 h-6 text-foreground" />
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold mb-2">{t("title")}</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t("description", { limit, feature: FEATURE_NAMES[feature] })}
          </p>

          <div className="bg-muted/50 rounded-lg p-3 mb-6">
            <div className="flex justify-between text-sm">
              <span>{FEATURE_NAMES[feature]}</span>
              <span className="font-medium text-destructive">
                {used}/{limit} used
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div className="h-1.5 rounded-full bg-destructive w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleCheckout("month")}
              disabled={!!loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading === "month" ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                t("upgradeMonthly", { label: prices.month.label })
              )}
            </button>
            <button
              onClick={() => handleCheckout("year")}
              disabled={!!loading}
              className="w-full py-3 px-4 border rounded-lg font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading === "year" ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                t("upgradeYearly", {
                  label: prices.year.label,
                  savings: prices.year.savings,
                })
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t("cancelAnytime")}
          </p>
        </div>
      </div>
    </>
  );
}
