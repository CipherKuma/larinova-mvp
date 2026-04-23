import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Module-level mocks — must be declared before importing the route.
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockCustomersCreate = vi.fn();
const mockSubscriptionsCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

vi.mock("@/lib/razorpay", () => ({
  razorpay: {
    customers: { create: (args: unknown) => mockCustomersCreate(args) },
    subscriptions: { create: (args: unknown) => mockSubscriptionsCreate(args) },
  },
}));

const originalEnv = { ...process.env };

function setConfiguredEnv() {
  process.env.RAZORPAY_KEY_ID = "rzp_test_abc";
  process.env.RAZORPAY_KEY_SECRET = "secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec";
  process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY = "plan_mo";
  process.env.RAZORPAY_PLAN_ID_PRO_YEARLY = "plan_yr";
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_abc";
}

function resetEnv() {
  process.env = { ...originalEnv };
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY;
  delete process.env.RAZORPAY_PLAN_ID_PRO_YEARLY;
  delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  delete process.env.SIMULATE_RAZORPAY;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetEnv();
});

afterEach(() => {
  process.env = originalEnv;
});

function req(body: unknown) {
  return new Request("http://localhost/api/razorpay/create-subscription", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Build a chainable Supabase-style query builder that returns `result` from .single()/.maybeSingle().
 * Each call to mockFrom returns a fresh builder so tests can scope per-table behaviour.
 */
function buildQueryReturning(
  results: Record<
    string,
    { single?: unknown; maybeSingle?: unknown } | unknown[]
  >,
) {
  // `results` shape: { [table]: { single: row } } or [{table, result}, ...] in order
  const tableCalls: Record<string, number> = {};

  return (table: string) => {
    tableCalls[table] = (tableCalls[table] ?? 0) + 1;

    const chain: {
      select: (cols: string) => typeof chain;
      eq: (col: string, val: unknown) => typeof chain;
      insert: (row: unknown) => Promise<{ data: null; error: null }>;
      update: (row: unknown) => typeof chain;
      single: () => Promise<{ data: unknown; error: null }>;
      maybeSingle: () => Promise<{ data: unknown; error: null }>;
    } = {
      select: () => chain,
      eq: () => chain,
      insert: async () => ({ data: null, error: null }),
      update: () => chain,
      single: async () => {
        const entry = results[table];
        if (Array.isArray(entry)) {
          const r = entry[tableCalls[table] - 1];
          return { data: r ?? null, error: null };
        }
        return {
          data: (entry as { single?: unknown })?.single ?? null,
          error: null,
        };
      },
      maybeSingle: async () => {
        const entry = results[table];
        if (Array.isArray(entry)) {
          const r = entry[tableCalls[table] - 1];
          return { data: r ?? null, error: null };
        }
        return {
          data: (entry as { maybeSingle?: unknown })?.maybeSingle ?? null,
          error: null,
        };
      },
    };

    return chain;
  };
}

describe("POST /api/razorpay/create-subscription", () => {
  it("returns 503 when razorpay env vars are missing", async () => {
    // No env set
    const { POST } = await import("./route");
    const res = await POST(req({ interval: "month" }));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("razorpay_not_configured");
  });

  it("returns 401 when user is unauthenticated", async () => {
    setConfiguredEnv();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockFrom.mockImplementation(buildQueryReturning({}));

    const { POST } = await import("./route");
    const res = await POST(req({ interval: "month" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    setConfiguredEnv();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "d@x.com" } },
    });
    mockFrom.mockImplementation(buildQueryReturning({}));

    const { POST } = await import("./route");
    const res = await POST(req({ interval: "weekly" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_request");
  });

  it("returns 404 when no doctor row", async () => {
    setConfiguredEnv();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "d@x.com" } },
    });
    mockFrom.mockImplementation(
      buildQueryReturning({
        larinova_doctors: { single: null },
      }),
    );

    const { POST } = await import("./route");
    const res = await POST(req({ interval: "month" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when already subscribed", async () => {
    setConfiguredEnv();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "d@x.com" } },
    });
    mockFrom.mockImplementation(
      buildQueryReturning({
        larinova_doctors: { single: { id: "d1", full_name: "Dr Test" } },
        larinova_subscriptions: {
          maybeSingle: {
            status: "active",
            plan: "pro",
            razorpay_subscription_id: "sub_xyz",
            razorpay_customer_id: "cust_1",
          },
        },
      }),
    );

    const { POST } = await import("./route");
    const res = await POST(req({ interval: "month" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("already_subscribed");
  });

  it("creates customer + subscription and returns ids", async () => {
    setConfiguredEnv();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "d@x.com" } },
    });
    // Two calls to larinova_subscriptions: 1) existence check (null), 2) upsert-existence check (null)
    mockFrom.mockImplementation(
      buildQueryReturning({
        larinova_doctors: { single: { id: "d1", full_name: "Dr Test" } },
        larinova_subscriptions: [
          { maybeSingle: null, single: null }, // initial existing check
          { maybeSingle: null, single: null }, // upsertSubscriptionRow's lookup
        ] as unknown as { single?: unknown; maybeSingle?: unknown }[],
      }),
    );

    mockCustomersCreate.mockResolvedValue({ id: "cust_1" });
    mockSubscriptionsCreate.mockResolvedValue({
      id: "sub_abc",
      short_url: "https://rzp.io/i/abc",
    });

    const { POST } = await import("./route");
    const res = await POST(req({ interval: "month" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.subscription_id).toBe("sub_abc");
    expect(json.short_url).toBe("https://rzp.io/i/abc");
    expect(json.key_id).toBe("rzp_test_abc");
    expect(mockCustomersCreate).toHaveBeenCalledOnce();
    expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ plan_id: "plan_mo", total_count: 12 }),
    );
  });

  it("short-circuits when SIMULATE_RAZORPAY=1", async () => {
    setConfiguredEnv();
    process.env.SIMULATE_RAZORPAY = "1";
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "d@x.com" } },
    });
    mockFrom.mockImplementation(
      buildQueryReturning({
        larinova_doctors: { single: { id: "d1abcdefg", full_name: "Dr Test" } },
        larinova_subscriptions: { maybeSingle: null, single: null },
      }),
    );

    const { POST } = await import("./route");
    const res = await POST(req({ interval: "year" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.simulated).toBe(true);
    expect(json.subscription_id).toMatch(/^sub_sim_/);
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockSubscriptionsCreate).not.toHaveBeenCalled();
  });
});
