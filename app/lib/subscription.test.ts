import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  isWhitelisted,
  PRO_WHITELIST,
  emailInList,
  getMonthlyConsultationCount,
  startOfMonthUtcISO,
  checkConsultationLimit,
} from "./subscription";
import { FREE_TIER_CONSULTATION_LIMIT } from "@/types/billing";

type Filter = { field: string; value: unknown };

function makeSupabaseWithCount(count: number) {
  const filters: Filter[] = [];
  const builder: any = {
    _filters: filters,
    select: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation((field: string, value: unknown) => {
      filters.push({ field, value });
      return builder;
    }),
    gte: vi.fn().mockImplementation((field: string, value: unknown) => {
      filters.push({ field, value });
      return Promise.resolve({ count, error: null });
    }),
  };
  const from = vi.fn().mockImplementation(() => builder);
  return { supabase: { from }, builder, from };
}

function makeSupabaseRouted(opts: {
  subscription: Record<string, unknown> | null;
  consultationCount: number;
}) {
  const subBuilder: any = {
    select: vi.fn().mockImplementation(() => subBuilder),
    eq: vi.fn().mockImplementation(() => subBuilder),
    single: vi.fn().mockResolvedValue({ data: opts.subscription, error: null }),
  };
  const consultFilters: Filter[] = [];
  const consultBuilder: any = {
    _filters: consultFilters,
    select: vi.fn().mockImplementation(() => consultBuilder),
    eq: vi.fn().mockImplementation((field: string, value: unknown) => {
      consultFilters.push({ field, value });
      return consultBuilder;
    }),
    gte: vi.fn().mockImplementation((field: string, value: unknown) => {
      consultFilters.push({ field, value });
      return Promise.resolve({ count: opts.consultationCount, error: null });
    }),
  };
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "larinova_subscriptions") return subBuilder;
    if (table === "larinova_consultations") return consultBuilder;
    throw new Error(`unexpected table: ${table}`);
  });
  return { supabase: { from }, subBuilder, consultBuilder };
}

describe("PRO_WHITELIST", () => {
  it("is an array of strings", () => {
    expect(Array.isArray(PRO_WHITELIST)).toBe(true);
    for (const e of PRO_WHITELIST) expect(typeof e).toBe("string");
  });
});

describe("emailInList", () => {
  it("returns false for an empty list", () => {
    expect(emailInList("any@example.com", [])).toBe(false);
  });

  it("returns true when email appears in the list exactly", () => {
    expect(emailInList("a@b.com", ["a@b.com"])).toBe(true);
  });

  it("is case-insensitive on both sides", () => {
    expect(emailInList("FOO@BAR.com", ["foo@bar.com"])).toBe(true);
    expect(emailInList("foo@bar.com", ["FOO@BAR.COM"])).toBe(true);
  });
});

describe("isWhitelisted", () => {
  it("returns false for an email not in the whitelist", () => {
    expect(isWhitelisted("nobody-12345@example.com")).toBe(false);
  });
});

describe("startOfMonthUtcISO", () => {
  it("returns the first day of the current month at 00:00:00 UTC", () => {
    const ref = new Date(Date.UTC(2026, 3, 23, 17, 42, 11));
    expect(startOfMonthUtcISO(ref)).toBe("2026-04-01T00:00:00.000Z");
  });

  it("handles December rollover correctly", () => {
    const ref = new Date(Date.UTC(2025, 11, 31, 23, 59, 59));
    expect(startOfMonthUtcISO(ref)).toBe("2025-12-01T00:00:00.000Z");
  });
});

describe("checkConsultationLimit", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("allows unlimited when subscription plan='pro' and status='active'", async () => {
    const { supabase } = makeSupabaseRouted({
      subscription: { plan: "pro", status: "active" },
      consultationCount: 9999,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    const result = await checkConsultationLimit("doctor-1");
    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("pro");
    expect(result.limit).toBe(Infinity);
  });

  it("allows unlimited when subscription plan='pro' and status='whitelisted'", async () => {
    const { supabase } = makeSupabaseRouted({
      subscription: { plan: "pro", status: "whitelisted" },
      consultationCount: 9999,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    const result = await checkConsultationLimit("doctor-1");
    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("pro");
    expect(result.limit).toBe(Infinity);
  });

  it("allows a free doctor below the monthly cap", async () => {
    const { supabase } = makeSupabaseRouted({
      subscription: { plan: "free", status: "active" },
      consultationCount: 5,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    const result = await checkConsultationLimit("doctor-2");
    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("free");
    expect(result.limit).toBe(FREE_TIER_CONSULTATION_LIMIT);
    expect(result.used).toBe(5);
  });

  it("blocks a free doctor at the monthly cap", async () => {
    const { supabase } = makeSupabaseRouted({
      subscription: { plan: "free", status: "active" },
      consultationCount: FREE_TIER_CONSULTATION_LIMIT,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    const result = await checkConsultationLimit("doctor-3");
    expect(result.allowed).toBe(false);
    expect(result.used).toBe(FREE_TIER_CONSULTATION_LIMIT);
  });

  it("defaults missing subscription to free plan", async () => {
    const { supabase } = makeSupabaseRouted({
      subscription: null,
      consultationCount: 21,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    const result = await checkConsultationLimit("doctor-4");
    expect(result.plan).toBe("free");
    expect(result.allowed).toBe(false);
  });
});

describe("getMonthlyConsultationCount", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("queries larinova_consultations filtered by doctor_id and start-of-month", async () => {
    const { supabase, from, builder } = makeSupabaseWithCount(7);
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const count = await getMonthlyConsultationCount(
      "doctor-uuid-1",
      new Date(Date.UTC(2026, 3, 23, 0, 0, 0)),
    );

    expect(count).toBe(7);
    expect(from).toHaveBeenCalledWith("larinova_consultations");
    expect(builder._filters).toContainEqual({
      field: "doctor_id",
      value: "doctor-uuid-1",
    });
    expect(builder._filters).toContainEqual({
      field: "created_at",
      value: "2026-04-01T00:00:00.000Z",
    });
  });

  it("returns 0 when supabase returns null count", async () => {
    const { supabase } = makeSupabaseWithCount(null as unknown as number);
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const count = await getMonthlyConsultationCount("doctor-x");
    expect(count).toBe(0);
  });
});
