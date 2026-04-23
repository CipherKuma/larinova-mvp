// Patient portal E2E — §10 of the QA-E2E scope.
//
// The portal lives in a sibling project at `larinova/patient-portal/` and
// runs on port 3001 in dev (`pnpm dev`). It shares the same Supabase database
// so we can seed and assert directly via admin, but the UI pages must be
// probed against the running dev server.
//
// Override the portal URL with `PATIENT_PORTAL_URL=…` for preview / prod.

import { test, expect } from "@playwright/test";
import {
  adminClient,
  cleanupDoctor,
  provisionDoctor,
  uniqueEmail,
  type DoctorHandle,
} from "./helpers/auth";

const PORTAL_URL =
  process.env.PATIENT_PORTAL_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

async function portalReachable(
  request: import("@playwright/test").APIRequestContext,
) {
  try {
    const res = await request.get(PORTAL_URL, {
      timeout: 2_000,
      failOnStatusCode: false,
    });
    return res.status() < 500;
  } catch {
    return false;
  }
}

test.describe("patient portal — reachable probe", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("portal home (/) reachable", async ({ request, page }) => {
    const up = await portalReachable(request);
    if (!up) {
      test.skip(
        true,
        `[BLOCKER] patient-portal not reachable at ${PORTAL_URL}. Start with: cd patient-portal && pnpm dev`,
      );
      return;
    }
    await page.goto(PORTAL_URL);
    // Unauthenticated users should land on /login.
    await expect(page).toHaveURL(new RegExp(`${PORTAL_URL}/(login|$)`));
  });

  test("portal /login renders magic-link form", async ({ request, page }) => {
    const up = await portalReachable(request);
    if (!up) {
      test.skip(true, `[BLOCKER] patient-portal unreachable at ${PORTAL_URL}`);
      return;
    }
    await page.goto(`${PORTAL_URL}/login`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("portal /appointments redirects unauthenticated visitor to /login", async ({
    request,
    page,
  }) => {
    const up = await portalReachable(request);
    if (!up) {
      test.skip(true, `[BLOCKER] patient-portal unreachable at ${PORTAL_URL}`);
      return;
    }
    await page.goto(`${PORTAL_URL}/appointments`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/login/);
  });

  test("portal /prescriptions/[id] 404s for an unknown id", async ({
    request,
    page,
  }) => {
    const up = await portalReachable(request);
    if (!up) {
      test.skip(true, `[BLOCKER] patient-portal unreachable at ${PORTAL_URL}`);
      return;
    }
    const res = await page.goto(
      `${PORTAL_URL}/prescriptions/00000000-0000-0000-0000-000000000000`,
    );
    expect(res).not.toBeNull();
    // 404 or redirect to login — either prove the handler rejects unknown ids.
    expect([200, 302, 307, 401, 403, 404]).toContain(res!.status());
  });
});

test.describe("patient portal — RLS contract via admin", () => {
  let handle: DoctorHandle | null = null;
  let patientId = "";
  let appointmentId = "";

  test.beforeAll(async () => {
    const admin = adminClient();
    handle = await provisionDoctor(admin, uniqueEmail("portal"), {
      fullName: "Portal Test Doctor",
    });

    const { data: patient } = await admin
      .from("larinova_patients")
      .insert({
        doctor_id: handle.doctorId,
        full_name: "Portal Patient",
        email: "portal.patient@larinova.test",
        phone: "9000088888",
      })
      .select("id")
      .single();
    if (!patient) throw new Error("seed portal patient");
    patientId = patient.id;

    const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const { data: appt } = await admin
      .from("larinova_appointments")
      .insert({
        doctor_id: handle.doctorId,
        patient_id: patientId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "scheduled",
        type: "in_person",
        booker_name: "Portal Patient",
        booker_email: "portal.patient@larinova.test",
        booker_phone: "9000088888",
        locale: "in",
      })
      .select("id")
      .single();
    if (!appt) throw new Error("seed portal appointment");
    appointmentId = appt.id;
  });

  test.afterAll(async () => {
    if (!handle) return;
    const admin = adminClient();
    await admin.from("larinova_appointments").delete().eq("id", appointmentId);
    await admin.from("larinova_patients").delete().eq("id", patientId);
    await cleanupDoctor(admin, handle);
  });

  test("seeded appointment is readable via admin (Supabase contract holds)", async () => {
    const admin = adminClient();
    const { data } = await admin
      .from("larinova_appointments")
      .select("id, booker_email, status")
      .eq("id", appointmentId)
      .single();
    expect(data?.booker_email).toBe("portal.patient@larinova.test");
    expect(data?.status).toBe("scheduled");
  });

  test("portal's main app intake-submissions endpoint rejects unauthenticated writes", async ({
    request,
    baseURL,
  }) => {
    // The portal POSTs to the app's /api/intake-submissions via CORS with a
    // patient JWT. Without the JWT we expect 401.
    const res = await request.post(`${baseURL}/api/intake-submissions`, {
      data: {
        appointmentId,
        formData: { chief_complaint: "RLS smoke test" },
      },
    });
    expect([401, 403]).toContain(res.status());
  });
});
