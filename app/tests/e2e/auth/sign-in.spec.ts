import { test, expect } from "@playwright/test";

test.describe("Sign In", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/en/sign-in");
    await page.waitForLoadState("networkidle");
  });

  test("should display sign-in form with all fields", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("should show validation error for empty email", async ({ page }) => {
    await page.getByLabel(/password/i).fill("testpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Form should not submit - email field is required
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test("should show validation error for empty password", async ({ page }) => {
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Form should not submit - password field is required
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test("should show error toast for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("nonexistent@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for error toast
    await expect(
      page.getByText(/sign in failed|invalid|not found/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should navigate to sign-up page via link", async ({ page }) => {
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test("should sign in successfully with valid credentials", async ({
    page,
  }) => {
    const email = process.env.TEST_DOCTOR_EMAIL;
    const password = process.env.TEST_DOCTOR_PASSWORD;

    if (!email || !password) {
      test.skip(
        true,
        "TEST_DOCTOR_EMAIL and TEST_DOCTOR_PASSWORD not set in .env.test",
      );
      return;
    }

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard or onboarding
    await page.waitForURL(/\/(en|ar)\/(onboarding)?$/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/sign-in/);
  });
});
