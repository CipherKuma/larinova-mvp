import { test as setup } from "@playwright/test";
import { loginAsDoctor } from "../helpers/auth";

setup("authenticate as test doctor", async ({ page }) => {
  await loginAsDoctor(page);
});
