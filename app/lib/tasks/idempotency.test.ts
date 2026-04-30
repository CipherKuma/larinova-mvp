import { describe, expect, it } from "vitest";
import {
  isRecentDuplicateTask,
  normalizeTaskFingerprint,
  type TaskFingerprint,
} from "./idempotency";

const baseTask: TaskFingerprint = {
  title: "Blood work for Raghu",
  description: null,
  type: "general",
  status: "pending",
  priority: "medium",
  due_date: null,
  patient_id: null,
  consultation_id: null,
  assigned_to: "doctor-1",
  created_by: "doctor-1",
};

describe("task idempotency", () => {
  it("treats equivalent recent task submissions as duplicates", () => {
    expect(
      isRecentDuplicateTask(
        {
          ...baseTask,
          title: " Blood work for Raghu ",
          created_at: "2026-04-30T07:00:10.000Z",
        },
        baseTask,
        new Date("2026-04-30T07:00:20.000Z"),
      ),
    ).toBe(true);
  });

  it("does not treat old matching tasks as duplicates", () => {
    expect(
      isRecentDuplicateTask(
        {
          ...baseTask,
          created_at: "2026-04-30T07:00:10.000Z",
        },
        baseTask,
        new Date("2026-04-30T07:01:00.001Z"),
      ),
    ).toBe(false);
  });

  it("does not collapse tasks with different statuses", () => {
    expect(
      isRecentDuplicateTask(
        {
          ...baseTask,
          status: "completed",
          created_at: "2026-04-30T07:00:10.000Z",
        },
        baseTask,
        new Date("2026-04-30T07:00:20.000Z"),
      ),
    ).toBe(false);
  });

  it("normalizes empty optional values to null", () => {
    expect(
      normalizeTaskFingerprint({
        ...baseTask,
        description: " ",
        patient_id: "",
      }),
    ).toMatchObject({
      description: null,
      patient_id: null,
    });
  });
});
