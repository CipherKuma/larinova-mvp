/**
 * Parses Playwright JSON results and pushes a summary to a Notion database.
 *
 * Usage:
 *   npx tsx tests/e2e/helpers/notion-report.ts
 *
 * Env vars (from .env.test):
 *   NOTION_API_TOKEN          – Notion integration token
 *   NOTION_TEST_RESULTS_DB_ID – Notion database ID for test results
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env.test") });

const RESULTS_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "test-results",
  "results.json"
);

interface TestResult {
  suites: Suite[];
  stats: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
    duration: number;
  };
}

interface Suite {
  title: string;
  specs: Spec[];
  suites?: Suite[];
}

interface Spec {
  title: string;
  ok: boolean;
  tests: { status: string; duration: number }[];
}

function flattenSpecs(suites: Suite[]): Spec[] {
  const specs: Spec[] = [];
  for (const suite of suites) {
    specs.push(...suite.specs);
    if (suite.suites) {
      specs.push(...flattenSpecs(suite.suites));
    }
  }
  return specs;
}

async function pushToNotion(
  token: string,
  dbId: string,
  result: TestResult
): Promise<void> {
  const specs = flattenSpecs(result.suites);
  const passed = specs.filter((s) => s.ok).length;
  const failed = specs.filter((s) => !s.ok).length;
  const total = specs.length;
  const durationMs = result.stats.duration;
  const durationSec = (durationMs / 1000).toFixed(1);

  const failedTests = specs
    .filter((s) => !s.ok)
    .map((s) => s.title)
    .join(", ");

  const body = {
    parent: { database_id: dbId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: `E2E Run — ${new Date().toISOString().slice(0, 16)}`,
            },
          },
        ],
      },
      Status: {
        select: { name: failed === 0 ? "Passed" : "Failed" },
      },
      Passed: { number: passed },
      Failed: { number: failed },
      Total: { number: total },
      Duration: {
        rich_text: [{ text: { content: `${durationSec}s` } }],
      },
      "Failed Tests": {
        rich_text: [
          { text: { content: failedTests.slice(0, 2000) || "None" } },
        ],
      },
    },
  };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API error ${res.status}: ${text}`);
  }

  console.log(
    `Notion report created: ${passed}/${total} passed, ${durationSec}s`
  );
}

async function main() {
  const token = process.env.NOTION_API_TOKEN;
  const dbId = process.env.NOTION_TEST_RESULTS_DB_ID;

  if (!token || !dbId) {
    console.error(
      "Missing NOTION_API_TOKEN or NOTION_TEST_RESULTS_DB_ID in .env.test"
    );
    process.exit(1);
  }

  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`Results file not found at ${RESULTS_PATH}`);
    console.error("Run tests first: pnpm test:e2e");
    process.exit(1);
  }

  const raw = fs.readFileSync(RESULTS_PATH, "utf-8");
  const result: TestResult = JSON.parse(raw);

  await pushToNotion(token, dbId, result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
