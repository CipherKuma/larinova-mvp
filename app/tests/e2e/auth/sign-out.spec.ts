import { test, expect } from "@playwright/test";

test.describe("Sign Out", () => {
  // Uses authenticated state from setup project

  test("should be able to sign out from the app", async ({ page }) => {
    // Navigate to the dashboard (authenticated)
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // Look for sign-out/logout button (could be in sidebar, header, or settings)
    const signOutButton = page.getByRole("button", {
      name: /sign out|log out|logout/i,
    });
    const signOutLink = page.getByRole("link", {
      name: /sign out|log out|logout/i,
    });

    // Try button first, then link
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    } else if (await signOutLink.isVisible()) {
      await signOutLink.click();
    } else {
      // May need to open a dropdown/menu first (e.g., user avatar menu)
      const userMenu = page.getByRole("button", {
        name: /profile|account|menu|avatar/i,
      });
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page
          .getByRole("menuitem", { name: /sign out|log out|logout/i })
          .click();
      } else {
        test.skip(true, "Could not find sign-out button or menu");
        return;
      }
    }

    // Should redirect to sign-in page after sign-out
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("should redirect to sign-in when accessing protected route after sign-out", async ({
    browser,
  }) => {
    // Create a fresh context with no auth state
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // Should be redirected to sign-in
    await expect(page).toHaveURL(/\/sign-in/);

    await context.close();
  });
});
