// i18n E2E — §12 of the QA-E2E scope.
//
// Guards against two regressions:
//   1. /id pages render without crashing (locale schema symmetry)
//   2. No large English strings leak into /id rendered pages (English chrome
//      is acceptable for technical keys that have no Bahasa equivalent; we
//      search for leaks of specific high-signal English phrases that MUST
//      have been translated)
//
// Also verifies the Bahasa translation file covers the same top-level
// namespaces as English.

import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "..", "..", "messages");

function loadJson(locale: string): Record<string, unknown> {
  const raw = fs.readFileSync(
    path.join(MESSAGES_DIR, `${locale}.json`),
    "utf8",
  );
  return JSON.parse(raw);
}

test.describe("i18n locale-file integrity", () => {
  test("id.json + in.json parse", () => {
    const en = loadJson("in");
    const id = loadJson("id");
    expect(typeof en).toBe("object");
    expect(typeof id).toBe("object");
  });

  test("id.json has the same top-level namespaces as in.json", () => {
    const enKeys = Object.keys(loadJson("in")).sort();
    const idKeys = Object.keys(loadJson("id")).sort();
    const missing = enKeys.filter((k) => !idKeys.includes(k));
    expect(
      missing,
      `missing top-level keys in id.json: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  test("id.json 'common' sub-keys are a superset of in.json 'common'", () => {
    const enCommon = Object.keys(
      (loadJson("in").common ?? {}) as Record<string, unknown>,
    );
    const idCommon = Object.keys(
      (loadJson("id").common ?? {}) as Record<string, unknown>,
    );
    const missing = enCommon.filter((k) => !idCommon.includes(k));
    expect(
      missing,
      `missing 'common' keys in id.json: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});

test.describe("i18n page-level rendering", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/in/sign-in renders English chrome", async ({ page }) => {
    await page.goto("/in/sign-in");
    await page.waitForLoadState("domcontentloaded");
    const body = (await page.locator("body").innerText()).toLowerCase();
    // Should contain at least one English marker token.
    const englishMarkers = ["email", "password", "sign in", "welcome"];
    const foundEnglish = englishMarkers.filter((w) => body.includes(w));
    expect(
      foundEnglish.length,
      `expected english markers, got body starting with: ${body.slice(0, 200)}`,
    ).toBeGreaterThan(0);
  });

  test("/id/sign-in renders Bahasa chrome", async ({ page }) => {
    await page.goto("/id/sign-in");
    await page.waitForLoadState("domcontentloaded");
    const body = (await page.locator("body").innerText()).toLowerCase();
    // Bahasa markers — common auth copy from id.json:
    // "Masuk" (sign in), "Email", "Kata sandi" (password), "Memuat" (loading)
    const bahasaMarkers = ["masuk", "kata sandi", "daftar", "lanjut"];
    const foundBahasa = bahasaMarkers.filter((w) => body.includes(w));
    expect(
      foundBahasa.length,
      `expected bahasa markers, got body starting with: ${body.slice(0, 200)}`,
    ).toBeGreaterThan(0);
  });

  test("/id/sign-in does NOT leak English auth phrases", async ({ page }) => {
    await page.goto("/id/sign-in");
    await page.waitForLoadState("domcontentloaded");
    const body = (await page.locator("body").innerText()).toLowerCase();

    // These exact English phrases should be translated on /id pages. "email"
    // is ALLOWED (used as a label in Bahasa too). Brand name "Larinova" OK.
    const mustBeTranslated = [
      /\bforgot password\b/,
      /\bsign up\b/,
      /\bwelcome back\b/,
    ];
    for (const rx of mustBeTranslated) {
      expect(
        rx.test(body),
        `English phrase ${rx} leaked into /id/sign-in — ${body.slice(0, 400)}`,
      ).toBe(false);
    }
  });

  test("locale switch preserves route (in → id)", async ({ page }) => {
    await page.goto("/in/sign-in");
    await page.waitForLoadState("domcontentloaded");

    // Navigate directly to the /id mirror — next-intl rewrites the locale
    // prefix without changing the path. We assert the path tail matches.
    await page.goto("/id/sign-in");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toMatch(/\/id\/sign-in$/);
  });
});
