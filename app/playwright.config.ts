import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({
  path: path.resolve(__dirname, ".env.local"),
  override: false,
});
dotenv.config({
  path: path.resolve(__dirname, ".env.test"),
  override: false,
});

const STORAGE_STATE = path.join(__dirname, ".playwright-data", "auth.json");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]],

  use: {
    baseURL: "http://localhost:3000",
    actionTimeout: 10_000,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "setup",
      testMatch: /e2e\/.*\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE,
      },
      dependencies: ["setup"],
    },
    {
      // Self-contained end-to-end journeys that provision their own users
      // via Supabase admin. They do not rely on the shared auth.json from
      // the `setup` project, so no dependency is declared.
      name: "journeys",
      testMatch: /^(?!.*\/e2e\/).*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    env: { SIMULATE_NOTIFY: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
