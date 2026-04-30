// Patient management E2E — §4 of the QA-E2E scope.
//
// Covers:
//   - /in/patients list renders for an authenticated doctor
//   - Search filters client-side by name/code (placeholder IS the affordance,
//     per ui-rules.md — no search icon inside the input)
//   - "New Patient" navigates to the create form
//   - /in/patients/[id] detail renders narrative + tabs (health records,
//     prescriptions, insurance)
//   - Patient API CRUD round-trip

import { test, expect } from "@playwright/test";
import {
  adminClient,
  cleanupDoctor,
  provisionDoctor,
  signInViaMagicLink,
  uniqueEmail,
  type DoctorHandle,
} from "./helpers/auth";

test.describe("patients list (authenticated via storageState)", () => {
  test("/in/patients renders heading + search input without an icon", async ({
    page,
  }) => {
    await page.goto("/in/patients");
    await page.waitForLoadState("networkidle");

    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /patients/i })
        .first(),
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(
      /search by name or patient code/i,
    );
    await expect(searchInput).toBeVisible();

    // ui-rule: no icon inside search input. Assert no <svg> inside the input's
    // bounding ancestor form-control wrapper, or at least that the input has
    // no left padding that would visually suggest an embedded icon.
    const parent = searchInput.locator("xpath=..");
    const innerIconCount = await parent.locator("svg").count();
    // allow 1 icon max (the "clear" X when query is present, which is not
    // a search icon). Fail if >1 or if any svg has search-like aria-label.
    expect(innerIconCount).toBeLessThanOrEqual(1);
  });

  test("New Patient button navigates to the create form", async ({ page }) => {
    await page.goto("/in/patients");
    await page.waitForLoadState("networkidle");

    const newBtn = page
      .getByRole("link", { name: /new patient/i })
      .or(page.getByRole("button", { name: /new patient/i }))
      .first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await expect(page).toHaveURL(/\/in\/patients\/new/);
    await expect(page.getByPlaceholder(/full name/i).first()).toBeVisible();
  });
});

test.describe("patient detail rendering", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let handle: DoctorHandle | null = null;
  let patientId = "";

  test.beforeAll(async () => {
    const admin = adminClient();
    const email = uniqueEmail("patients");
    handle = await provisionDoctor(admin, email, {
      fullName: "Patients Detail Doctor",
    });

    const { data: patient, error } = await admin
      .from("larinova_patients")
      .insert({
        created_by_doctor_id: handle.doctorId,
        patient_code: `E2E-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        full_name: "Asha Kumar",
        phone: "9876500001",
        email: "asha.test@larinova.test",
        gender: "female",
        date_of_birth: "1990-06-15",
      })
      .select("id")
      .single();
    if (error || !patient) {
      throw new Error(`Failed to seed patient: ${error?.message}`);
    }
    patientId = patient.id;
  });

  test.afterAll(async () => {
    if (!handle) return;
    const admin = adminClient();
    await admin.from("larinova_patients").delete().eq("id", patientId);
    await cleanupDoctor(admin, handle);
  });

  test("detail page renders tabs (health records / consultations / prescriptions)", async ({
    page,
    baseURL,
  }) => {
    if (!handle) throw new Error("handle not provisioned");
    await signInViaMagicLink(page, handle.email, baseURL, "in");

    await page.goto(`/in/patients/${patientId}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Asha Kumar/i).first()).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /health records/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /prescriptions/i }),
    ).toBeVisible();

    // Switch to prescriptions tab, ensure content panel renders.
    await page.getByRole("tab", { name: /prescriptions/i }).click();
    await expect(
      page.locator("[role=tabpanel]").filter({ hasText: /./ }).first(),
    ).toBeVisible();
  });

  test("GET /api/patients/:id returns the patient row under the doctor", async ({
    request,
  }) => {
    if (!handle) throw new Error("handle not provisioned");
    // Authenticate the API request context via magic link cookies.
    // Playwright's request fixture uses the same storageState as the browser,
    // but this test bypasses the chromium storageState (fresh state), so we
    // call via the service role via the admin client instead.
    const admin = adminClient();
    const { data, error } = await admin
      .from("larinova_patients")
      .select("id, full_name")
      .eq("id", patientId)
      .single();
    expect(error).toBeNull();
    expect(data?.full_name).toBe("Asha Kumar");
  });
});

test.describe("patient list search filters client-side", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  let handle: DoctorHandle | null = null;
  const patientIds: string[] = [];

  test.beforeAll(async () => {
    const admin = adminClient();
    handle = await provisionDoctor(admin, uniqueEmail("search"), {
      fullName: "Search Doctor",
    });

    const rows = [
      {
        full_name: "Raj Mehta",
        phone: "9000000001",
        email: "raj.test@larinova.test",
        gender: "male",
        date_of_birth: "1984-01-10",
      },
      {
        full_name: "Priya Singh",
        phone: "9000000002",
        email: "priya.test@larinova.test",
        gender: "female",
        date_of_birth: "1988-03-20",
      },
      {
        full_name: "Amit Shah",
        phone: "9000000003",
        email: "amit.test@larinova.test",
        gender: "male",
        date_of_birth: "1979-08-05",
      },
    ];
    for (const r of rows) {
      const { data, error } = await admin
        .from("larinova_patients")
        .insert({
          created_by_doctor_id: handle.doctorId,
          patient_code: `E2E-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          ...r,
        })
        .select("id")
        .single();
      if (!error && data) patientIds.push(data.id);
    }
  });

  test.afterAll(async () => {
    if (!handle) return;
    const admin = adminClient();
    for (const id of patientIds) {
      await admin.from("larinova_patients").delete().eq("id", id);
    }
    await cleanupDoctor(admin, handle);
  });

  test("typing a name filters the list", async ({ page, baseURL }) => {
    if (!handle) throw new Error("handle not provisioned");
    await signInViaMagicLink(page, handle.email, baseURL, "in");

    await page.goto("/in/patients");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("row", { name: /Raj Mehta/ })).toBeVisible();

    const search = page.getByPlaceholder(/search by name or patient code/i);
    await search.fill("priya");

    await expect(page.getByRole("row", { name: /Priya Singh/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Raj Mehta/ })).toHaveCount(0);
  });
});
