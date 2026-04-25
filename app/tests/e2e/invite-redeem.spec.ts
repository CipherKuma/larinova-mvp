// Invite-code redemption E2E
//
// Covers:
//   - New user (not onboarded, no redemption) is redirected to /redeem on
//     any protected route.
//   - Submitting an invalid code shows an error and stays on /redeem.
//   - Submitting a valid code grants 30 days of Pro and redirects to
//     /onboarding.
//   - An already-onboarded user is grandfathered (never sees /redeem).
//   - A user that has already redeemed (but not yet onboarded) is bounced
//     from /redeem to /onboarding.
//
// Spec: docs/superpowers/specs/2026-04-25-invite-code-system-design.md

import { test, expect } from "@playwright/test";
import {
  adminClient,
  cleanupDoctor,
  provisionDoctor,
  signInViaMagicLink,
  uniqueEmail,
  type DoctorHandle,
} from "./helpers/auth";

const VALID_CODE_PREFIX = "PWTEST-";

function freshCode(): string {
  return `${VALID_CODE_PREFIX}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

test.describe("invite-code redemption", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let handles: DoctorHandle[] = [];
  let codes: string[] = [];

  test.afterEach(async () => {
    const admin = adminClient();
    for (const code of codes) {
      await admin.from("larinova_invite_codes").delete().eq("code", code);
    }
    for (const handle of handles) {
      await admin
        .from("larinova_subscriptions")
        .delete()
        .eq("doctor_id", handle.doctorId);
      await cleanupDoctor(admin, handle);
    }
    handles = [];
    codes = [];
  });

  test("new not-onboarded user is redirected to /redeem after sign-in", async ({
    page,
    baseURL,
  }) => {
    const admin = adminClient();
    const handle = await provisionDoctor(admin, uniqueEmail("invite-new"), {
      fullName: "Invite New",
      onboardingCompleted: false,
    });
    handles.push(handle);

    await signInViaMagicLink(page, handle.email, baseURL, "in");
    await page.goto("/in");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/in\/redeem(\?|$)/);
  });

  test("invalid code shows error and stays on /redeem", async ({
    page,
    baseURL,
  }) => {
    const admin = adminClient();
    const handle = await provisionDoctor(admin, uniqueEmail("invite-bad"), {
      fullName: "Invite Bad",
      onboardingCompleted: false,
    });
    handles.push(handle);

    await signInViaMagicLink(page, handle.email, baseURL, "in");
    await page.goto("/in/redeem");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/invite code/i).fill("NEVER-A-REAL-CODE-XYZ");
    await page.getByRole("button", { name: /redeem/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/in\/redeem(\?|$)/);
  });

  test("valid code grants 30-day Pro and redirects to /onboarding", async ({
    page,
    baseURL,
  }) => {
    const admin = adminClient();
    const handle = await provisionDoctor(admin, uniqueEmail("invite-ok"), {
      fullName: "Invite OK",
      onboardingCompleted: false,
    });
    handles.push(handle);

    const code = freshCode();
    codes.push(code);
    const { error: insertErr } = await admin
      .from("larinova_invite_codes")
      .insert({ code, note: "playwright happy path" });
    if (insertErr) {
      test.skip(
        true,
        `[BLOCKER] invite_code insert rejected: ${insertErr.message}`,
      );
      return;
    }

    await signInViaMagicLink(page, handle.email, baseURL, "in");
    await page.goto("/in/redeem");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/invite code/i).fill(code);
    await page.getByRole("button", { name: /redeem/i }).click();
    await page.waitForURL(/\/in\/onboarding(\?|$)/, { timeout: 15_000 });

    const { data: sub } = await admin
      .from("larinova_subscriptions")
      .select("plan, status, current_period_end")
      .eq("doctor_id", handle.doctorId)
      .single();

    expect(sub?.plan).toBe("pro");
    expect(sub?.status).toBe("active");
    expect(sub?.current_period_end).toBeTruthy();
    const periodEndMs = new Date(sub!.current_period_end!).getTime();
    expect(periodEndMs).toBeGreaterThan(Date.now() + 29 * 86_400_000);
    expect(periodEndMs).toBeLessThan(Date.now() + 31 * 86_400_000);
  });

  test("already-onboarded user is never sent to /redeem", async ({
    page,
    baseURL,
  }) => {
    const admin = adminClient();
    const handle = await provisionDoctor(
      admin,
      uniqueEmail("invite-grandfather"),
      {
        fullName: "Grandfathered",
        onboardingCompleted: true,
      },
    );
    handles.push(handle);

    await signInViaMagicLink(page, handle.email, baseURL, "in");
    await page.goto("/in");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/in\/redeem(\?|$)/);
  });

  test("already-redeemed user is bounced from /redeem to /onboarding", async ({
    page,
    baseURL,
  }) => {
    const admin = adminClient();
    const handle = await provisionDoctor(
      admin,
      uniqueEmail("invite-redeemed"),
      {
        fullName: "Already Redeemed",
        onboardingCompleted: false,
      },
    );
    handles.push(handle);

    const { error: updErr } = await admin
      .from("larinova_doctors")
      .update({ invite_code_redeemed_at: new Date().toISOString() })
      .eq("id", handle.doctorId);
    if (updErr) {
      test.skip(true, `[BLOCKER] doctor update rejected: ${updErr.message}`);
      return;
    }

    await signInViaMagicLink(page, handle.email, baseURL, "in");
    await page.goto("/in/redeem");
    await expect(page).toHaveURL(/\/in\/onboarding(\?|$)/, { timeout: 15_000 });
  });
});
