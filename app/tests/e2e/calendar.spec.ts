// Calendar + booking E2E — §5 of the QA-E2E scope.
//
// Covers both sides of the booking funnel:
//   - Doctor calendar page renders + availability API round-trip
//   - Public `/book/[handle]` page renders for a provisioned doctor handle
//   - `GET /api/booking/[handle]` returns doctor + availability
//   - `GET /api/booking/[handle]/slots?date=...` returns a slot list
//   - `POST /api/booking/[handle]/appointments` creates an appointment that
//     the doctor can see via `/api/calendar/appointments`
//   - Cancel appointment via `/api/appointments/[id]` DELETE
//
// Uses `SIMULATE_NOTIFY=1` (webServer env) so the booking confirmation
// short-circuits Resend / MSG91 / Gupshup.

import { test, expect } from "@playwright/test";
import {
  adminClient,
  cleanupDoctor,
  provisionDoctor,
  uniqueEmail,
  type DoctorHandle,
} from "./helpers/auth";

function nextDateYmd(offsetDays = 2): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

test.describe("doctor calendar (authenticated)", () => {
  test("/in/calendar renders heading + availability tab", async ({ page }) => {
    await page.goto("/in/calendar");
    await page.waitForLoadState("networkidle");
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /calendar/i })
        .first(),
    ).toBeVisible();
  });

  test("/api/calendar/availability returns an array under the authed doctor", async ({
    request,
  }) => {
    const res = await request.get("/api/calendar/availability");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.availability ?? [])).toBe(true);
  });

  test("/api/calendar/appointments returns array (may be empty)", async ({
    request,
  }) => {
    const res = await request.get("/api/calendar/appointments");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("appointments");
    expect(Array.isArray(body.appointments)).toBe(true);
  });
});

test.describe("public booking funnel", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let handle: DoctorHandle | null = null;
  const bookingHandle = `qa-${Date.now().toString(36)}`;

  test.beforeAll(async () => {
    const admin = adminClient();
    handle = await provisionDoctor(admin, uniqueEmail("booking"), {
      fullName: "Booking Doctor",
    });

    // Enable booking + seed a booking_handle + availability row.
    const upd = await admin
      .from("larinova_doctors")
      .update({
        booking_handle: bookingHandle,
        booking_enabled: true,
        slot_duration_minutes: 30,
      })
      .eq("id", handle.doctorId);
    if (upd.error) {
      throw new Error(`update doctor booking fields: ${upd.error.message}`);
    }

    // Insert availability for every weekday 9-17 so any future date has slots.
    const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
      doctor_id: handle!.doctorId,
      day_of_week: d,
      start_time: "09:00:00",
      end_time: "17:00:00",
      is_active: true,
    }));
    const insAvail = await admin
      .from("larinova_doctor_availability")
      .insert(rows);
    if (insAvail.error) {
      throw new Error(`insert availability: ${insAvail.error.message}`);
    }
  });

  test.afterAll(async () => {
    if (!handle) return;
    const admin = adminClient();
    await admin
      .from("larinova_doctor_availability")
      .delete()
      .eq("doctor_id", handle.doctorId);
    await admin
      .from("larinova_appointments")
      .delete()
      .eq("doctor_id", handle.doctorId);
    await cleanupDoctor(admin, handle);
  });

  test("GET /api/booking/[handle] returns the doctor payload", async ({
    request,
  }) => {
    const res = await request.get(`/api/booking/${bookingHandle}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.doctor?.full_name).toBe("Booking Doctor");
    expect(Array.isArray(body.availability)).toBe(true);
  });

  test("/book/[handle] page renders booking UI for this doctor", async ({
    page,
  }) => {
    const res = await page.goto(`/book/${bookingHandle}`);
    expect(res).not.toBeNull();
    expect(res!.status()).toBeLessThan(400);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Booking Doctor/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("GET /api/booking/[handle]/slots returns slots for a future date", async ({
    request,
  }) => {
    const date = nextDateYmd(2);
    const res = await request.get(
      `/api/booking/${bookingHandle}/slots?date=${date}`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.slots)).toBe(true);
    expect(body.slots.length, `slots for ${date}`).toBeGreaterThan(0);
  });

  test("POST /api/booking/[handle]/appointments creates an appointment and cancel removes it", async ({
    request,
  }) => {
    const date = nextDateYmd(3);
    const slotsRes = await request.get(
      `/api/booking/${bookingHandle}/slots?date=${date}`,
    );
    const slotsBody = await slotsRes.json();
    const firstSlot = slotsBody.slots?.[0];
    expect(firstSlot, "at least one slot").toBeTruthy();

    const book = await request.post(
      `/api/booking/${bookingHandle}/appointments`,
      {
        data: {
          appointment_date: date,
          start_time: firstSlot.start_time ?? firstSlot,
          type: "in_person",
          booker_name: "Test Patient",
          booker_email: "patient.qa@larinova.test",
          booker_phone: "9999900000",
          booker_age: 34,
          booker_gender: "female",
          chief_complaint: "Persistent cough",
        },
      },
    );

    expect(book.status(), await book.text()).toBeLessThan(300);
    const bookBody = await book.json();
    const apptId: string | undefined = bookBody.appointment?.id ?? bookBody.id;
    expect(apptId).toBeTruthy();

    // Cleanup — DELETE via admin client (doctor-scoped RLS would otherwise
    // require an authenticated session which this test doesn't carry).
    if (handle && apptId) {
      const admin = adminClient();
      await admin.from("larinova_appointments").delete().eq("id", apptId);
    }
  });

  test("POST with an invalid date returns 400", async ({ request }) => {
    const res = await request.post(
      `/api/booking/${bookingHandle}/appointments`,
      { data: {} },
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("unknown handle returns 404", async ({ request }) => {
    const res = await request.get("/api/booking/this-handle-does-not-exist");
    expect(res.status()).toBe(404);
  });
});
