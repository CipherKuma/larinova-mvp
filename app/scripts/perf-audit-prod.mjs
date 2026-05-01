import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

if (process.env.PERF_ENV_FILE) {
  dotenv.config({ path: process.env.PERF_ENV_FILE, override: true });
}
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });

const BASE_URL = process.env.PERF_BASE_URL ?? "https://app.larinova.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERF_EMAIL = process.env.PERF_DOCTOR_EMAIL ?? "qa-e2e-perf@larinova.test";
const PERF_PASSWORD = process.env.PERF_DOCTOR_PASSWORD ?? "QAE2ESeed!2026";

const pageRoutes = [
  "/in/sign-in",
  "/id/sign-in",
  "/in/access",
  "/in/redeem",
  "/in",
  "/in/patients",
  "/in/patients/new",
  "/in/consultations",
  "/in/consultations/new",
  "/in/calendar",
  "/in/tasks",
  "/in/documents",
  "/in/issues",
  "/in/issues/new",
  "/in/settings/billing",
  "/in/settings/intake",
  "/in/voice-ai-testing",
];

const safeApiRoutes = [
  "/api/geo",
  "/api/razorpay/healthz",
  "/api/dashboard/home",
  "/api/dashboard/stats",
  "/api/dashboard/next-patient",
  "/api/user/shell",
  "/api/subscription/status",
  "/api/calendar/appointments",
  "/api/calendar/availability",
  "/api/calendar/handle",
  "/api/patients?limit=100",
  "/api/tasks?limit=100",
  "/api/documents",
  "/api/issues/list",
  "/api/follow-ups/flagged",
  "/api/intake-templates",
  "/api/helena/conversations",
  "/api/consultation/streaming-session",
  "/api/medicines/search?q=paracetamol",
  "/api/formulary/search?q=paracetamol",
  "/api/nmc/lookup?regNo=12345&council=",
];

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function errorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
}

function throwSupabase(error, context) {
  if (error) {
    throw new Error(`${context}: ${errorMessage(error)}`);
  }
}

function base64UrlEncode(input) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function projectRef() {
  return new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL)).host.split(
    ".",
  )[0];
}

function buildSessionCookies(session, origin) {
  const storageKey = `sb-${projectRef()}-auth-token`;
  const encoded = `base64-${base64UrlEncode(JSON.stringify(session))}`;
  const maxChunkSize = 3180;
  const chunks = [];

  if (encoded.length <= maxChunkSize) {
    chunks.push({ name: storageKey, value: encoded });
  } else {
    for (let i = 0, idx = 0; i < encoded.length; i += maxChunkSize, idx += 1) {
      chunks.push({
        name: `${storageKey}.${idx}`,
        value: encoded.slice(i, i + maxChunkSize),
      });
    }
  }

  return chunks.map((chunk) => ({ ...chunk, url: origin }));
}

async function ensureDoctorSession() {
  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  throwSupabase(listError, "Failed to list auth users");

  let user = list.users.find((entry) => entry.email === PERF_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: PERF_EMAIL,
      password: PERF_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "QA Perf Doctor" },
    });
    throwSupabase(error, "Failed to create perf auth user");
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password: PERF_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "QA Perf Doctor" },
    });
    throwSupabase(error, "Failed to update perf auth user");
    user = data.user;
  }

  const { data: doctor } = await admin
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!doctor) {
    const { error } = await admin.from("larinova_doctors").insert({
      user_id: user.id,
      email: PERF_EMAIL,
      first_name: "QA",
      last_name: "Perf Doctor",
      specialization: "General Medicine",
      locale: "in",
      onboarding_completed: true,
    });
    throwSupabase(error, "Failed to create perf doctor row");
  }

  const tokenRes = await fetch(
    `${requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL)}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: PERF_EMAIL, password: PERF_PASSWORD }),
    },
  );

  if (!tokenRes.ok) {
    throw new Error(`Supabase token grant failed ${tokenRes.status}: ${await tokenRes.text()}`);
  }

  const session = await tokenRes.json();
  return {
    ...session,
    expires_at:
      session.expires_at ??
      Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600),
  };
}

function compactResponse(url, status, method, durationMs, error) {
  return {
    method,
    status,
    durationMs: Math.round(durationMs),
    url: url.replace(BASE_URL, ""),
    error,
  };
}

async function measurePage(page, route) {
  const target = new URL(route, BASE_URL).toString();
  const requests = new Map();
  const responses = [];

  const onRequest = (request) => {
    const url = request.url();
    if (url.startsWith(BASE_URL)) {
      requests.set(request, Date.now());
    }
  };
  const onResponse = async (response) => {
    const request = response.request();
    const start = requests.get(request);
    if (!start) return;
    let error;
    try {
      await response.finished();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    responses.push(
      compactResponse(
        response.url(),
        response.status(),
        request.method(),
        Date.now() - start,
        error,
      ),
    );
  };

  page.on("request", onRequest);
  page.on("response", onResponse);
  const startedAt = Date.now();
  let navigationError;
  let status = 0;

  try {
    const response = await page.goto(target, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    status = response?.status() ?? 0;
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  } catch (err) {
    navigationError = err instanceof Error ? err.message : String(err);
  }

  const elapsedMs = Date.now() - startedAt;
  const metrics = await page
    .evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paints = Object.fromEntries(
        performance
          .getEntriesByType("paint")
          .map((entry) => [entry.name, Math.round(entry.startTime)]),
      );
      if (!nav) return { paints };
      return {
        domContentLoadedMs: Math.round(
          nav.domContentLoadedEventEnd - nav.startTime,
        ),
        loadMs: Math.round(nav.loadEventEnd - nav.startTime),
        responseStartMs: Math.round(nav.responseStart - nav.startTime),
        transferSize: nav.transferSize,
        encodedBodySize: nav.encodedBodySize,
        decodedBodySize: nav.decodedBodySize,
        paints,
      };
    })
    .catch(() => ({}));

  page.off("request", onRequest);
  page.off("response", onResponse);

  return {
    route,
    finalUrl: page.url().replace(BASE_URL, ""),
    status,
    elapsedMs,
    navigationError,
    metrics,
    apiCalls: responses
      .filter((response) => response.url.startsWith("/api/"))
      .sort((a, b) => b.durationMs - a.durationMs),
  };
}

async function measureApi(page, route) {
  const result = await page.evaluate(async (input) => {
    const startedAt = performance.now();
    try {
      const response = await fetch(input.route, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const text = await response.text();
      return {
        route: input.route,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        bytes: text.length,
        ok: response.ok,
      };
    } catch (err) {
      return {
        route: input.route,
        status: 0,
        durationMs: Math.round(performance.now() - startedAt),
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, { route });
  return result;
}

export async function run({ page, context }) {
  try {
    const origin = new URL(BASE_URL).origin;
    const session = await ensureDoctorSession();
    const refreshAuthCookies = async () => {
      await context.clearCookies({
        name: new RegExp(`^sb-${projectRef()}-auth-token`),
      });
      await context.addCookies(buildSessionCookies(session, origin));
    };

    await refreshAuthCookies();

    const pages = [];
    for (const route of pageRoutes) {
      await refreshAuthCookies();
      pages.push(await measurePage(page, route));
    }

    const apis = [];
    await refreshAuthCookies();
    for (const route of safeApiRoutes) {
      apis.push(await measureApi(page, route));
    }

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      pageCount: pages.length,
      apiCount: apis.length,
      pages,
      apis: apis.sort((a, b) => b.durationMs - a.durationMs),
    };

    const outDir = path.resolve("perf-reports");
    await fs.mkdir(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const jsonPath = path.join(outDir, `prod-perf-${stamp}.json`);
    await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

    const slowPages = [...pages]
      .sort((a, b) => b.elapsedMs - a.elapsedMs)
      .slice(0, 8);
    const slowApis = [...apis]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10);

    return {
      jsonPath,
      slowPages: slowPages.map((entry) => ({
        route: entry.route,
        finalUrl: entry.finalUrl,
        status: entry.status,
        elapsedMs: entry.elapsedMs,
        dcl: entry.metrics?.domContentLoadedMs,
        apiCalls: entry.apiCalls.slice(0, 5),
      })),
      slowApis,
    };
  } catch (error) {
    throw new Error(errorMessage(error));
  }
}
