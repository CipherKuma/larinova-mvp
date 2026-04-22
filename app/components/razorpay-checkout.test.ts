import { describe, it, expect } from "vitest";
import {
  interpretCreateSubscription,
  loadCheckoutScript,
} from "./razorpay-checkout";

function mkResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("interpretCreateSubscription", () => {
  it("maps 401 → unauthorized", async () => {
    const r = await interpretCreateSubscription(mkResponse(401, {}));
    expect(r.kind).toBe("unauthorized");
  });

  it("maps 503 → not_configured", async () => {
    const r = await interpretCreateSubscription(
      mkResponse(503, { error: "razorpay_not_configured" }),
    );
    expect(r.kind).toBe("not_configured");
  });

  it("maps 409 already_subscribed → already_subscribed", async () => {
    const r = await interpretCreateSubscription(
      mkResponse(409, { error: "already_subscribed" }),
    );
    expect(r.kind).toBe("already_subscribed");
  });

  it("maps 409 whitelisted_no_checkout → whitelisted", async () => {
    const r = await interpretCreateSubscription(
      mkResponse(409, { error: "whitelisted_no_checkout" }),
    );
    expect(r.kind).toBe("whitelisted");
  });

  it("maps 500 → error with code", async () => {
    const r = await interpretCreateSubscription(
      mkResponse(500, { error: "razorpay_subscription_failed" }),
    );
    expect(r.kind).toBe("error");
    if (r.kind === "error") expect(r.code).toBe("razorpay_subscription_failed");
  });

  it("maps 200 → ok with body", async () => {
    const r = await interpretCreateSubscription(
      mkResponse(200, {
        subscription_id: "sub_1",
        short_url: "x",
        key_id: "rzp_test_a",
      }),
    );
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.body.subscription_id).toBe("sub_1");
      expect(r.body.key_id).toBe("rzp_test_a");
    }
  });
});

describe("loadCheckoutScript", () => {
  it("rejects when window is unavailable (node environment)", async () => {
    await expect(loadCheckoutScript()).rejects.toThrow("window_unavailable");
  });
});
