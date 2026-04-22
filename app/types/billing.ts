export type PlanType = "free" | "pro";
export type BillingInterval = "month" | "year";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "whitelisted";
export type AIFeature = "summary" | "medical_codes" | "helena_chat";

export interface Subscription {
  id: string;
  doctor_id: string;
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  plan: PlanType;
  billing_interval: BillingInterval | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageCheck {
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanType;
}

export const FREE_TIER_LIMITS: Record<AIFeature, number> = {
  summary: 10000,
  medical_codes: 10000,
  helena_chat: 10000,
};

export const FREE_TIER_CONSULTATION_LIMIT = 20;

export type PricingRegion = "IN" | "ID" | "default";

export const PLAN_PRICES: Record<
  PricingRegion,
  {
    currency: string;
    symbol: string;
    month: { amount: number; label: string };
    year: { amount: number; label: string; savings: string };
  }
> = {
  IN: {
    currency: "INR",
    symbol: "₹",
    month: { amount: 150000, label: "₹1,500/month" },
    year: { amount: 1500000, label: "₹15,000/year", savings: "₹3,000" },
  },
  ID: {
    currency: "IDR",
    symbol: "Rp",
    month: { amount: 29900000, label: "Rp 299,000/month" },
    year: {
      amount: 299000000,
      label: "Rp 2,990,000/year",
      savings: "Rp 598,000",
    },
  },
  default: {
    currency: "USD",
    symbol: "$",
    month: { amount: 2000, label: "$20/month" },
    year: { amount: 20000, label: "$200/year", savings: "$40" },
  },
} as const;
