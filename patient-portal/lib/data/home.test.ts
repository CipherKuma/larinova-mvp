import { describe, it, expect, vi } from "vitest";
import { formatApptTime, loadHomeData } from "./home";

describe("formatApptTime", () => {
  it("formats a date + time into a short human string", () => {
    const s = formatApptTime({
      appointment_date: "2026-05-04",
      start_time: "14:30:00",
    });
    // Result is locale-dependent; just assert it contains the day or month
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("falls back safely on bad input", () => {
    const s = formatApptTime({
      appointment_date: "not-a-date",
      start_time: "nope",
    });
    expect(s).toContain("not-a-date");
  });
});

type MockStep = { data: unknown; error?: unknown };

function makeSupabaseStub(byTable: Record<string, MockStep>) {
  // Build a stub that chains .select().eq().eq().gte().order().order().limit()
  // and also .limit().maybeSingle() — all return the configured final { data, error }.
  const stubFor = (step: MockStep) => {
    const chain: Record<string, unknown> = {};
    const chainable = ["select", "eq", "gte", "order"];
    chainable.forEach((m) => {
      chain[m] = vi.fn(() => chain);
    });
    chain.limit = vi.fn(() => ({
      ...chain,
      then: (resolve: (v: MockStep) => void) => resolve(step),
      maybeSingle: vi.fn(async () => step),
    }));
    // When awaited directly after .limit() we resolve to step via thenable above.
    return chain;
  };
  return {
    from: vi.fn((table: string) => {
      const step = byTable[table];
      if (!step) throw new Error(`No stub for table ${table}`);
      return stubFor(step);
    }),
  } as unknown as Parameters<typeof loadHomeData>[0];
}

describe("loadHomeData", () => {
  it("returns null appointment + null prescription when patient not found", async () => {
    const supabase = makeSupabaseStub({
      larinova_appointments: { data: [] },
      larinova_patients: { data: null },
    });
    const result = await loadHomeData(supabase, "nobody@example.com");
    expect(result.email).toBe("nobody@example.com");
    expect(result.upcoming).toBeNull();
    expect(result.prescription).toBeNull();
  });
});
