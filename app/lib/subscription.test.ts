import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { isWhitelisted, PRO_WHITELIST, emailInList } from "./subscription";

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
