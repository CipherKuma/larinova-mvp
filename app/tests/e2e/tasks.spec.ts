import { expect, test } from "@playwright/test";
import {
  adminClient,
  cleanupDoctor,
  provisionDoctor,
  signInViaMagicLink,
  uniqueEmail,
  type DoctorHandle,
} from "./helpers/auth";

test.describe("tasks", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let handle: DoctorHandle | null = null;

  test.afterEach(async () => {
    if (!handle) return;
    await cleanupDoctor(adminClient(), handle);
    handle = null;
  });

  test("two immediate identical create requests persist one task", async ({
    page,
    baseURL,
  }) => {
    const admin = adminClient();
    const email = uniqueEmail("task-dup");
    handle = await provisionDoctor(admin, email, {
      fullName: "Task Duplicate Doctor",
    });
    await signInViaMagicLink(page, email, baseURL, "in");

    const title = `Blood work for Raghu ${Date.now()}`;
    const payload = {
      title,
      description: null,
      type: "general",
      status: "pending",
      priority: "medium",
      due_date: null,
      patient_id: null,
      consultation_id: null,
    };

    const first = await page.request.post("/api/tasks", { data: payload });
    const second = await page.request.post("/api/tasks", { data: payload });

    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ duplicate: true });

    const { data, error } = await admin
      .from("larinova_tasks")
      .select("id,title,status,created_at")
      .eq("created_by", handle.doctorId)
      .eq("title", title);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({ title, status: "pending" });
  });
});
