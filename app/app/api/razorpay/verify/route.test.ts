import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import crypto from "crypto";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(),
  }),
}));

const originalEnv = { ...process.env };

function setEnv() {
  process.env.RAZORPAY_KEY_ID = "rzp_test_abc";
  process.env.RAZORPAY_KEY_SECRET = "the_key_secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec";
  process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY = "plan_mo";
  process.env.RAZORPAY_PLAN_ID_PRO_YEARLY = "plan_yr";
}

function resetEnv() {
  process.env = { ...originalEnv };
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY;
  delete process.env.RAZORPAY_PLAN_ID_PRO_YEARLY;
  delete process.env.SIMULATE_RAZORPAY;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetEnv();
});

afterEach(() => {
  process.env = originalEnv;
});

function sig(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function req(body: unknown) {
  return new Request("http://localhost/api/razorpay/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/razorpay/verify", () => {
  it("returns 503 without env", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_payment_id: "p",
        razorpay_signature: "s",
        razorpay_subscription_id: "sub_1",
      }),
    );
    expect(res.status).toBe(503);
  });

  it("returns 401 when unauthenticated", async () => {
    setEnv();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_payment_id: "p",
        razorpay_signature: "s",
        razorpay_subscription_id: "sub_1",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when neither subscription nor order id provided", async () => {
    setEnv();
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_payment_id: "p",
        razorpay_signature: "s",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts a valid subscription signature", async () => {
    setEnv();
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const paymentId = "pay_1";
    const subId = "sub_1";
    const signature = sig(`${paymentId}|${subId}`, "the_key_secret");
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        razorpay_subscription_id: subId,
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it("rejects a bad subscription signature", async () => {
    setEnv();
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_payment_id: "pay_1",
        razorpay_signature: "bad",
        razorpay_subscription_id: "sub_1",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_signature");
  });

  it("accepts a valid order signature", async () => {
    setEnv();
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const orderId = "order_1";
    const paymentId = "pay_2";
    const signature = sig(`${orderId}|${paymentId}`, "the_key_secret");
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    );
    expect(res.status).toBe(200);
  });

  it("short-circuits under SIMULATE_RAZORPAY", async () => {
    setEnv();
    process.env.SIMULATE_RAZORPAY = "1";
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const { POST } = await import("./route");
    const res = await POST(
      req({
        razorpay_payment_id: "p",
        razorpay_signature: "anything",
        razorpay_subscription_id: "sub_1",
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.simulated).toBe(true);
  });
});
