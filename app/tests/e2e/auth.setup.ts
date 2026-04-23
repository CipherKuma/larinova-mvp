// Shared E2E auth setup — provisions a canonical QA doctor via Supabase admin,
// signs them in via magic link, and persists session state to
// .playwright-data/auth.json so every chromium-project spec that declares
// `dependencies: ["setup"]` inherits the authenticated session.

import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
  STORAGE_STATE_PATH,
  adminClient,
  provisionDoctor,
  signInViaMagicLink,
  saveStorageState,
} from "./helpers/auth";

export const SETUP_DOCTOR_EMAIL = "qa-setup-doctor@larinova.test";

setup("authenticate QA doctor", async ({ page, baseURL }) => {
  const dir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const admin = adminClient();
  await provisionDoctor(admin, SETUP_DOCTOR_EMAIL, {
    fullName: "QA Setup Doctor",
    specialization: "General Medicine",
    locale: "in",
    onboardingCompleted: true,
  });

  await signInViaMagicLink(page, SETUP_DOCTOR_EMAIL, baseURL, "in");
  await saveStorageState(page);
});
