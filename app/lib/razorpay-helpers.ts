import crypto from "crypto";
import type { BillingInterval } from "@/types/billing";

export type RazorpayMode = "test" | "live" | "unconfigured";

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_WEBHOOK_SECRET &&
    process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY &&
    process.env.RAZORPAY_PLAN_ID_PRO_YEARLY,
  );
}

export function getRazorpayMode(): RazorpayMode {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) return "unconfigured";
  if (key.startsWith("rzp_test_")) return "test";
  if (key.startsWith("rzp_live_")) return "live";
  return "unconfigured";
}

export function shouldSimulateRazorpay(): boolean {
  return process.env.SIMULATE_RAZORPAY === "1";
}

export function getPlanId(interval: BillingInterval): string | null {
  if (interval === "month") {
    return process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY || null;
  }
  if (interval === "year") {
    return process.env.RAZORPAY_PLAN_ID_PRO_YEARLY || null;
  }
  return null;
}

export function paiseToRupees(paise: number): string {
  if (!Number.isFinite(paise)) return "₹0";
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Verify a Razorpay webhook signature.
 * HMAC-SHA256 of raw body keyed with the webhook secret, compared in constant time.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return safeCompare(expected, signature);
}

/**
 * Verify a Razorpay subscription payment signature from the Checkout handler callback.
 * HMAC-SHA256 of `${payment_id}|${subscription_id}` keyed with the key secret.
 */
export function verifySubscriptionPaymentSignature(args: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  keySecret: string | undefined;
}): boolean {
  const { paymentId, subscriptionId, signature, keySecret } = args;
  if (!keySecret || !paymentId || !subscriptionId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeCompare(expected, signature);
}

/**
 * Verify a Razorpay one-off order payment signature.
 * HMAC-SHA256 of `${order_id}|${payment_id}`.
 */
export function verifyOrderPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string | undefined;
}): boolean {
  const { orderId, paymentId, signature, keySecret } = args;
  if (!keySecret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeCompare(expected, signature);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Convert a Razorpay unix-seconds timestamp to an ISO string, or null.
 */
export function razorpayTsToIso(ts: number | null | undefined): string | null {
  if (!ts || !Number.isFinite(ts)) return null;
  return new Date(ts * 1000).toISOString();
}
