import { type Page } from "@playwright/test";
import path from "path";

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  ".playwright-data",
  "auth.json",
);

/**
 * Authenticate via Supabase email/password and persist the session
 * to .playwright-data/auth.json so all "chromium" project tests
 * can reuse the authenticated state.
 *
 * Call this from your auth.setup.ts file.
 */
export async function loginAsDoctor(page: Page): Promise<void> {
  const email = process.env.TEST_DOCTOR_EMAIL;
  const password = process.env.TEST_DOCTOR_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_DOCTOR_EMAIL and TEST_DOCTOR_PASSWORD must be set in .env.test",
    );
  }

  // Navigate to the sign-in page (locale-prefixed)
  await page.goto("/en/sign-in");
  await page.waitForLoadState("networkidle");

  // Fill in credentials using accessible locators
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for navigation to authenticated area (dashboard or onboarding)
  await page.waitForURL(/\/(en|ar)\/(onboarding)?$/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  // Persist session so other tests can reuse it
  await page.context().storageState({ path: STORAGE_STATE_PATH });
}

export { STORAGE_STATE_PATH };
