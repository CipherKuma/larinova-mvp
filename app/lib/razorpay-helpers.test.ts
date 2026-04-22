import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  verifySubscriptionPaymentSignature,
  verifyOrderPaymentSignature,
  getPlanId,
  paiseToRupees,
  isRazorpayConfigured,
  getRazorpayMode,
  shouldSimulateRazorpay,
  razorpayTsToIso,
} from "./razorpay-helpers";

const originalEnv = { ...process.env };

function resetEnv() {
  process.env = { ...originalEnv };
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY;
  delete process.env.RAZORPAY_PLAN_ID_PRO_YEARLY;
  delete process.env.SIMULATE_RAZORPAY;
}

beforeEach(resetEnv);
afterEach(() => {
  process.env = originalEnv;
});

describe("verifyWebhookSignature", () => {
  const secret = "webhook_secret_abc";
  const body = JSON.stringify({ event: "subscription.activated", id: "1" });

  it("accepts a valid signature", () => {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body + "x", sig, secret)).toBe(false);
  });

  it("rejects an invalid signature", () => {
    expect(verifyWebhookSignature(body, "deadbeef", secret)).toBe(false);
  });

  it("rejects when secret is missing", () => {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, undefined)).toBe(false);
  });

  it("rejects when signature is null/undefined", () => {
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, undefined, secret)).toBe(false);
  });
});

describe("verifySubscriptionPaymentSignature", () => {
  const keySecret = "key_secret_xyz";
  const paymentId = "pay_ABC123";
  const subscriptionId = "sub_XYZ789";

  it("verifies a correctly signed payload", () => {
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");
    expect(
      verifySubscriptionPaymentSignature({
        paymentId,
        subscriptionId,
        signature,
        keySecret,
      }),
    ).toBe(true);
  });

  it("rejects mismatched signature", () => {
    expect(
      verifySubscriptionPaymentSignature({
        paymentId,
        subscriptionId,
        signature: "bad",
        keySecret,
      }),
    ).toBe(false);
  });

  it("rejects when any required field is empty", () => {
    expect(
      verifySubscriptionPaymentSignature({
        paymentId: "",
        subscriptionId,
        signature: "x",
        keySecret,
      }),
    ).toBe(false);
    expect(
      verifySubscriptionPaymentSignature({
        paymentId,
        subscriptionId,
        signature: "x",
        keySecret: undefined,
      }),
    ).toBe(false);
  });
});

describe("verifyOrderPaymentSignature", () => {
  const keySecret = "key_secret_xyz";
  const orderId = "order_111";
  const paymentId = "pay_222";

  it("verifies an order payment", () => {
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    expect(
      verifyOrderPaymentSignature({
        orderId,
        paymentId,
        signature,
        keySecret,
      }),
    ).toBe(true);
  });

  it("rejects tampered order id", () => {
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    expect(
      verifyOrderPaymentSignature({
        orderId: "other",
        paymentId,
        signature,
        keySecret,
      }),
    ).toBe(false);
  });
});

describe("getPlanId", () => {
  it("returns the monthly plan id", () => {
    process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY = "plan_month_1";
    expect(getPlanId("month")).toBe("plan_month_1");
  });

  it("returns the yearly plan id", () => {
    process.env.RAZORPAY_PLAN_ID_PRO_YEARLY = "plan_year_1";
    expect(getPlanId("year")).toBe("plan_year_1");
  });

  it("returns null if env missing", () => {
    expect(getPlanId("month")).toBe(null);
    expect(getPlanId("year")).toBe(null);
  });
});

describe("paiseToRupees", () => {
  it("formats whole-rupee amounts with comma grouping", () => {
    expect(paiseToRupees(150000)).toBe("₹1,500");
    expect(paiseToRupees(1500000)).toBe("₹15,000");
  });

  it("formats sub-rupee amounts with two decimals", () => {
    expect(paiseToRupees(150050)).toBe("₹1,500.50");
    expect(paiseToRupees(99)).toBe("₹0.99");
  });

  it("handles zero and non-finite", () => {
    expect(paiseToRupees(0)).toBe("₹0");
    expect(paiseToRupees(NaN)).toBe("₹0");
  });
});

describe("isRazorpayConfigured", () => {
  it("returns false when keys missing", () => {
    expect(isRazorpayConfigured()).toBe(false);
  });

  it("returns true when all keys present", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_xxx";
    process.env.RAZORPAY_KEY_SECRET = "s";
    process.env.RAZORPAY_WEBHOOK_SECRET = "w";
    process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY = "m";
    process.env.RAZORPAY_PLAN_ID_PRO_YEARLY = "y";
    expect(isRazorpayConfigured()).toBe(true);
  });

  it("returns false if any single key is missing", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_xxx";
    process.env.RAZORPAY_KEY_SECRET = "s";
    process.env.RAZORPAY_WEBHOOK_SECRET = "w";
    process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY = "m";
    expect(isRazorpayConfigured()).toBe(false);
  });
});

describe("getRazorpayMode", () => {
  it("detects test mode", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_abc";
    expect(getRazorpayMode()).toBe("test");
  });

  it("detects live mode", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_live_abc";
    expect(getRazorpayMode()).toBe("live");
  });

  it("returns unconfigured for unknown prefix", () => {
    process.env.RAZORPAY_KEY_ID = "garbage";
    expect(getRazorpayMode()).toBe("unconfigured");
  });

  it("returns unconfigured when missing", () => {
    expect(getRazorpayMode()).toBe("unconfigured");
  });
});

describe("shouldSimulateRazorpay", () => {
  it("is false by default", () => {
    expect(shouldSimulateRazorpay()).toBe(false);
  });

  it("is true when SIMULATE_RAZORPAY=1", () => {
    process.env.SIMULATE_RAZORPAY = "1";
    expect(shouldSimulateRazorpay()).toBe(true);
  });
});

describe("razorpayTsToIso", () => {
  it("converts unix seconds to ISO", () => {
    expect(razorpayTsToIso(1700000000)).toBe(
      new Date(1700000000 * 1000).toISOString(),
    );
  });

  it("returns null for falsy / non-finite", () => {
    expect(razorpayTsToIso(null)).toBe(null);
    expect(razorpayTsToIso(undefined)).toBe(null);
    expect(razorpayTsToIso(0)).toBe(null);
    expect(razorpayTsToIso(NaN)).toBe(null);
  });
});
