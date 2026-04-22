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
} from "./subscription";

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
