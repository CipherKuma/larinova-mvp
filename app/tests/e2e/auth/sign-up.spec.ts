import { test, expect } from "@playwright/test";

test.describe("Sign Up", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/en/sign-up");
    await page.waitForLoadState("networkidle");
  });

  test("should display sign-up form with all fields", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation for name too short", async ({ page }) => {
    await page.getByLabel(/full name/i).fill("A");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("testpassword123");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should stay on sign-up page due to validation
    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test("should show validation for invalid email", async ({ page }) => {
    await page.getByLabel(/full name/i).fill("Test Doctor");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("testpassword123");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should stay on sign-up page due to validation
    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test("should show validation for short password", async ({ page }) => {
    await page.getByLabel(/full name/i).fill("Test Doctor");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("short");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should stay on sign-up page due to validation
    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test("should show error for existing account", async ({ page }) => {
    const email = process.env.TEST_DOCTOR_EMAIL;
    if (!email) {
      test.skip(true, "TEST_DOCTOR_EMAIL not set in .env.test");
      return;
    }

    await page.getByLabel(/full name/i).fill("Existing Doctor");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("testpassword123");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should show "already exists" error toast
    await expect(page.getByText(/already exists|account.*exists/i)).toBeVisible(
      { timeout: 10_000 },
    );
  });

  test("should navigate to sign-in page via link", async ({ page }) => {
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});
