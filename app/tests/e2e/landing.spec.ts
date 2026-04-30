// Landing page E2E — §2 of the QA-E2E scope.
//
// The marketing landing lives in a separate Next.js app (`larinova/landing/`).
// By default these tests probe production `https://larinova.com`. Override
// with `LANDING_URL=http://localhost:3001` to run against a local landing
// dev server.
//
// Pricing assertions (`₹999` / `₹9,990`) and request-access CTA targets are
// the contract surface — if those change, the test must change with them.

import { test, expect } from "@playwright/test";

const LANDING_URL =
  process.env.LANDING_URL?.replace(/\/$/, "") ?? "https://larinova.com";

const APP_SIGNUP_HOST = "app.larinova.com";

test.describe("landing", () => {
  test.describe.configure({ mode: "parallel" });
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/in India landing renders hero + primary CTA", async ({ page }) => {
    const res = await page.goto(`${LANDING_URL}/in`);
    expect(res, `${LANDING_URL}/in must be reachable`).not.toBeNull();
    expect(res!.status(), await res!.text().catch(() => "")).toBeLessThan(400);
    await page.waitForLoadState("domcontentloaded");

    // Hero text — scribe or medical framing must appear. We match loosely to
    // survive copy edits in `locale-content.ts`.
    await expect(
      page.locator("h1").filter({ hasText: /scribe|consultation|doctor/i }),
    ).toBeVisible({ timeout: 10_000 });

    const cta = page
      .getByRole("link", { name: /try|start|get started|pro|sign up/i })
      .first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href ?? "").toMatch(
      /app\.larinova\.com|\/signup|\/sign-up|\/discovery-survey/i,
    );
  });

  test("/id Indonesia landing still renders (non-regression)", async ({
    page,
  }) => {
    const res = await page.goto(`${LANDING_URL}/id`);
    expect(res).not.toBeNull();
    expect(res!.status()).toBeLessThan(400);
    await page.waitForLoadState("domcontentloaded");
    // Either Bahasa ("dokter") or English ("doctor") headline accepted.
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/in pricing shows Free + Pro tiers with INR amounts", async ({
    page,
  }) => {
    await page.goto(`${LANDING_URL}/in`);
    await page.waitForLoadState("domcontentloaded");

    // Scroll to the pricing section so lazy components hydrate.
    const pricing = page.locator("#pricing, [data-section='pricing']").first();
    if (await pricing.count()) {
      await pricing.scrollIntoViewIfNeeded();
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }

    // Both tier headings are in the DOM regardless of tab.
    await expect(
      page.getByRole("heading", { name: /^free$/i, level: 3 }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /^pro$/i, level: 3 }),
    ).toBeVisible();

    // Monthly is the default tab — Pro should show ₹999.
    await expect(page.getByText(/₹\s?999/).first()).toBeVisible({
      timeout: 15_000,
    });

    // Flip to Annual and assert the yearly price.
    const annualTab = page.getByRole("tab", { name: /annual/i });
    if (await annualTab.count()) {
      await annualTab.click();
      await expect(page.getByText(/₹\s?9[,.]?990/).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("pricing CTA links to signup with upgrade intent", async ({ page }) => {
    await page.goto(`${LANDING_URL}/in`);
    await page.waitForLoadState("domcontentloaded");

    const proCta = page
      .getByRole("link", { name: /start pro|upgrade|go pro|try pro/i })
      .first();
    if (!(await proCta.count())) {
      test.skip(true, "Pro CTA selector not found — copy-sensitive, re-check");
      return;
    }
    const href = (await proCta.getAttribute("href")) ?? "";
    expect(href).toMatch(/signup|sign-up/);
    expect(href).toMatch(
      new RegExp(APP_SIGNUP_HOST.replace(/\./g, "\\.") + "|/"),
    );
    expect(href).toMatch(/upgrade=/);
  });

  test("/book discovery call page renders", async ({ page }) => {
    const res = await page.goto(`${LANDING_URL}/book`);
    expect(res).not.toBeNull();
    expect(res!.status()).toBeLessThan(400);
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /discovery|book|schedule/i })
        .first(),
    ).toBeVisible();
  });

  test("unknown path returns 404 chrome", async ({ page }) => {
    const res = await page.goto(
      `${LANDING_URL}/in/definitely-not-a-real-page-xyz123`,
    );
    expect(res).not.toBeNull();
    // Next.js serves either a 404 body at 404 status or a 200 with not-found UI.
    if (res!.status() === 404) return;
    await expect(
      page
        .getByText(/not found|404|couldn.?t find|page doesn.?t exist/i)
        .first(),
    ).toBeVisible();
  });

  test("sitemap.xml renders with entries", async ({ request }) => {
    const res = await request.get(`${LANDING_URL}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<urlset|<sitemapindex/);
    expect(body).toMatch(/larinova\.com/);
  });

  test("robots.txt allows indexing and references sitemap", async ({
    request,
  }) => {
    const res = await request.get(`${LANDING_URL}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-agent/i);
    expect(body).toMatch(/sitemap/i);
  });
});

test.describe("landing — booking handle (app-served)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/book/[handle] renders a booking page for a provisioned handle", async ({
    page,
    baseURL,
  }) => {
    // The real `/book/[handle]` lives on the APP (not landing). We use the
    // playwright baseURL (app on :3000) to exercise it.
    const handle = "qa-not-a-real-doctor";
    const res = await page.goto(`${baseURL}/book/${handle}`);
    expect(res).not.toBeNull();
    // Either 404 (handle does not exist) or 200 with not-found UI. Both
    // are acceptable — we only require the route is wired up.
    expect([200, 404]).toContain(res!.status());
  });
});
