// Doctor pilot-unblock journey — §6.1 of the India OPD platform plan.
//
// Covers the full free-tier guard path end-to-end:
//   1. A doctor is provisioned via Supabase admin (simulating signup + verify)
//   2. The doctor signs in through the real UI
//   3. The billing page reflects the Free plan at 0/20 consults
//   4. Starting a consultation under the cap succeeds
//   5. After 20 consultations this month, /api/consultations/start returns 402
//   6. The billing page then shows the exhausted quota
//
// Run: pnpm playwright test tests/doctor-journey.spec.ts
//
// Notes:
//   - Supabase admin bypasses the email round-trip — the provisioned user is
//     functionally identical to one that signed up and clicked the verify link.
//   - SIMULATE_NOTIFY=1 is set so any notify() calls short-circuit locally.

import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({
  path: path.resolve(__dirname, "..", ".env.local"),
  override: false,
});
dotenv.config({
  path: path.resolve(__dirname, "..", ".env.test"),
  override: false,
});

process.env.SIMULATE_NOTIFY = process.env.SIMULATE_NOTIFY ?? "1";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set " +
        "(checked .env, .env.local, .env.test). Cannot run doctor-journey test.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Supabase RLS scopes larinova_doctors SELECT to the owner (auth.uid =
// user_id), so /api/auth/check-email always reports exists=false for
// unauthenticated callers and the sign-in UI short-circuits every doctor
// into the magic-link OTP step. Rather than run a real mail inbox inside
// the test, we ask Supabase admin to generate the exact magic-link URL
// that email delivery would have contained, then navigate to it. The
// Supabase auth endpoint sets session cookies and redirects us through
// /auth/callback into the authenticated app — exactly as a human user
// clicking the link in their inbox would experience.
async function signInViaMagicLink(
  page: Page,
  email: string,
  baseURL: string | undefined,
) {
  const admin = adminClient();
  const origin = baseURL ?? "http://localhost:3000";
  const redirectTo = `${origin}/in/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error || !data?.properties?.action_link) {
    throw new Error(
      `Failed to generate magic link: ${error?.message ?? "no action_link"}`,
    );
  }

  await page.goto(data.properties.action_link);
  // Supabase redirects → /in/auth/callback → client exchanges tokens and
  // routes to /in (onboarding_completed=true) or /in/onboarding.
  await page.waitForURL(/\/in(\/|$|\?)/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

test.describe("Doctor pilot-unblock journey", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.describe.configure({ mode: "serial" });

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `doctor-${uniqueSuffix}@larinova.test`;
  const password = `PlaywrightTest!${uniqueSuffix}`;
  let userId: string;
  let doctorId: string;

  test.beforeAll(async () => {
    const admin = adminClient();

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Playwright Test Doctor" },
      });
    if (createErr || !created.user) {
      throw new Error(
        `Failed to create auth user: ${createErr?.message ?? "unknown"}`,
      );
    }
    userId = created.user.id;

    const { data: doctor, error: doctorErr } = await admin
      .from("larinova_doctors")
      .insert({
        user_id: userId,
        email,
        full_name: "Playwright Test Doctor",
        specialization: "General Medicine",
        locale: "in",
        onboarding_completed: true,
      })
      .select("id")
      .single();
    if (doctorErr || !doctor) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(
        `Failed to create doctor row: ${doctorErr?.message ?? "unknown"}`,
      );
    }
    doctorId = doctor.id;
  });

  test.afterAll(async () => {
    const admin = adminClient();
    if (doctorId) {
      await admin
        .from("larinova_consultations")
        .delete()
        .eq("doctor_id", doctorId);
      await admin
        .from("larinova_subscriptions")
        .delete()
        .eq("doctor_id", doctorId);
      await admin.from("larinova_doctors").delete().eq("id", doctorId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("signup → verify → login → consult → 402 → billing reflects quota", async ({
    page,
    request,
  }) => {
    // Step 1: Sign in via real UI (signup + verify already provisioned above).
    await signInUI(page, email, password);

    // Step 2: Billing page — Free plan, 0/20.
    await page.goto("/in/settings/billing");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Billing/i })).toBeVisible();
    await expect(page.getByText(/Free Plan/i)).toBeVisible();
    await expect(page.getByText(/^0\s*\/\s*20\b/).first()).toBeVisible();

    const initialStatus = await request.get("/api/subscription/status");
    expect(initialStatus.status()).toBe(200);
    const initialBody = await initialStatus.json();
    expect(initialBody.subscription?.plan ?? "free").toBe("free");
    expect(initialBody.usage?.consultations?.used).toBe(0);
    expect(initialBody.usage?.consultations?.limit).toBe(20);

    // Step 3: Starting a consult while under cap succeeds.
    const firstStart = await request.post("/api/consultations/start", {
      data: {
        patient_name: "Playwright Patient 1",
        chief_complaint: "fever",
      },
    });
    expect(firstStart.status(), await firstStart.text()).toBe(200);
    const firstBody = await firstStart.json();
    expect(firstBody.success).toBe(true);
    expect(firstBody.consultation?.id).toBeTruthy();

    // Step 4: Seed the doctor up to the free-tier limit. Clear first, then
    // insert exactly 20 rows so we know the boundary regardless of the
    // consultation already created above.
    const admin = adminClient();
    await admin
      .from("larinova_consultations")
      .delete()
      .eq("doctor_id", doctorId);
    const nowIso = new Date().toISOString();
    const seedRows = Array.from({ length: 20 }, () => ({
      doctor_id: doctorId,
      start_time: nowIso,
      status: "completed" as const,
    }));
    const { error: seedErr } = await admin
      .from("larinova_consultations")
      .insert(seedRows);
    expect(seedErr, seedErr?.message).toBeNull();

    // Step 5: Next start call returns 402 free_tier_exhausted.
    const blocked = await request.post("/api/consultations/start", {
      data: {
        patient_name: "Over-Limit Patient",
        chief_complaint: "fever",
      },
    });
    expect(blocked.status()).toBe(402);
    const blockedBody = await blocked.json();
    expect(blockedBody.error).toBe("free_tier_exhausted");
    expect(blockedBody.limit).toBe(20);
    expect(blockedBody.used).toBeGreaterThanOrEqual(20);

    // Step 6: Billing page reflects the exhausted quota.
    const exhaustedStatus = await request.get("/api/subscription/status");
    expect(exhaustedStatus.status()).toBe(200);
    const exhaustedBody = await exhaustedStatus.json();
    expect(exhaustedBody.usage?.consultations?.used).toBeGreaterThanOrEqual(20);

    await page.goto("/in/settings/billing");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/\b2[0-9]\s*\/\s*20\b/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
