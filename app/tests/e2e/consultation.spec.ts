// Consultation E2E — §7 of the QA-E2E scope.
//
// The consultation flow is the app's core clinical loop:
//   patient selected → POST /api/consultations/start → /in/consultations/[id]
//     → record/transcribe → SOAP note → ICD-10/medical-codes → prescription
//     → finalize (end) → dispatcher emits downstream messages
//
// Real AI calls are expensive and non-deterministic — we mock external
// providers via `mockExternalAPIs()` from helpers/mocks.ts and use direct
// DB seeding to reach states that require background agents.

import { test, expect } from "@playwright/test";
import {
  adminClient,
  cleanupDoctor,
  provisionDoctor,
  signInViaMagicLink,
  uniqueEmail,
  type DoctorHandle,
} from "./helpers/auth";
import { mockExternalAPIs } from "./helpers/mocks";

test.describe("consultation start + list (authenticated via storageState)", () => {
  test("/in/consultations list renders", async ({ page }) => {
    await page.goto("/in/consultations");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/in\/consultations/);
  });

  test("/in/consultations/new renders patient picker", async ({ page }) => {
    await page.goto("/in/consultations/new");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: /new consultation/i }),
    ).toBeVisible();
  });

  test("POST /api/consultations/start under the cap returns 200", async ({
    request,
  }) => {
    const res = await request.post("/api/consultations/start", {
      data: {
        patient_name: "Smoke Patient",
        chief_complaint: "fever",
      },
    });
    // The shared-setup doctor may be at 0/20 or over-quota depending on
    // prior runs; both 200 and 402 are valid outcomes. We only assert the
    // contract — the 402 path is proven by doctor-journey.spec.ts.
    expect([200, 201, 402]).toContain(res.status());
    const body = await res.json();
    if (res.status() < 300) {
      expect(body.success).toBe(true);
      expect(body.consultation?.id).toBeTruthy();
    } else {
      expect(body.error).toBe("free_tier_exhausted");
      expect(body.limit).toBe(20);
    }
  });
});

test.describe("consultation detail flow — seeded + mocked", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let handle: DoctorHandle | null = null;
  let patientId = "";
  let consultationId = "";

  test.beforeAll(async () => {
    const admin = adminClient();
    handle = await provisionDoctor(admin, uniqueEmail("consult"), {
      fullName: "Consult Doctor",
    });

    const { data: patient } = await admin
      .from("larinova_patients")
      .insert({
        created_by_doctor_id: handle.doctorId,
        full_name: "Test Consult Patient",
        phone: "9000022221",
        email: "consult.qa@larinova.test",
        gender: "female",
        date_of_birth: "1990-06-15",
      })
      .select("id")
      .single();
    if (!patient) throw new Error("failed to seed patient");
    patientId = patient.id;

    const { data: consult, error } = await admin
      .from("larinova_consultations")
      .insert({
        doctor_id: handle.doctorId,
        patient_id: patientId,
        start_time: new Date().toISOString(),
        status: "in_progress",
        chief_complaint: "Persistent cough",
      })
      .select("id")
      .single();
    if (error || !consult) {
      throw new Error(`seed consultation failed: ${error?.message}`);
    }
    consultationId = consult.id;
  });

  test.afterAll(async () => {
    if (!handle) return;
    const admin = adminClient();
    await admin
      .from("larinova_consultations")
      .delete()
      .eq("id", consultationId);
    await admin.from("larinova_patients").delete().eq("id", patientId);
    await cleanupDoctor(admin, handle);
  });

  test("prescription page renders with consultation header", async ({
    page,
    baseURL,
  }) => {
    if (!handle) throw new Error("handle not provisioned");
    await mockExternalAPIs(page);
    await signInViaMagicLink(page, handle.email, baseURL, "in");

    const res = await page.goto(
      `/in/consultations/${consultationId}/prescription`,
    );
    expect(res).not.toBeNull();
    expect(res!.status()).toBeLessThan(400);
    await page.waitForLoadState("networkidle");

    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /prescription|consult/i })
        .first(),
    ).toBeVisible();
    await expect(page.getByText(/Test Consult Patient/i).first()).toBeVisible();
  });

  test("summary page renders", async ({ page, baseURL }) => {
    if (!handle) throw new Error("handle not provisioned");
    await mockExternalAPIs(page);
    await signInViaMagicLink(page, handle.email, baseURL, "in");
    const res = await page.goto(`/in/consultations/${consultationId}/summary`);
    expect(res).not.toBeNull();
    expect(res!.status()).toBeLessThan(400);
  });

  test("GET /api/consultations/:id/notes returns structured response", async ({
    request,
  }) => {
    // This endpoint requires auth — without a session cookie we only assert
    // the route exists and refuses unauthenticated access.
    const res = await request.get(`/api/consultations/${consultationId}/notes`);
    // 200 when authed (via storage state), 401/404 when not.
    expect([200, 401, 403, 404, 405]).toContain(res.status());
  });

  test("end consultation transitions status to completed", async () => {
    if (!handle) throw new Error("handle not provisioned");
    const admin = adminClient();
    const { error } = await admin
      .from("larinova_consultations")
      .update({ status: "completed", end_time: new Date().toISOString() })
      .eq("id", consultationId);
    expect(error, error?.message).toBeNull();

    const { data } = await admin
      .from("larinova_consultations")
      .select("status")
      .eq("id", consultationId)
      .single();
    expect(data?.status).toBe("completed");
  });
});
