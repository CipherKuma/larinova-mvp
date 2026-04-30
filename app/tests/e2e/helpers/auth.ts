import { type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });
dotenv.config({
  path: path.resolve(__dirname, "..", "..", "..", ".env.local"),
  override: false,
});
dotenv.config({
  path: path.resolve(__dirname, "..", "..", "..", ".env.test"),
  override: false,
});

export const STORAGE_STATE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  ".playwright-data",
  "auth.json",
);

export const QA_EMAIL_PREFIX = "qa-e2e";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function adminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function uniqueEmail(tag: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `${QA_EMAIL_PREFIX}-${tag}-${suffix}@larinova.test`;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const clean = fullName.trim().replace(/\s+/g, " ");
  const [firstName = "QA", ...rest] = clean.split(" ");
  return { firstName, lastName: rest.join(" ") || "Doctor" };
}

export interface DoctorHandle {
  userId: string;
  doctorId: string;
  email: string;
}

export interface ProvisionOpts {
  fullName?: string;
  specialization?: string;
  locale?: "in" | "id";
  handle?: string;
  onboardingCompleted?: boolean;
}

export async function provisionDoctor(
  admin: SupabaseClient,
  email: string,
  opts: ProvisionOpts = {},
): Promise<DoctorHandle> {
  const { data: existing } = await admin.auth.admin.listUsers();
  const foundUser = existing?.users?.find((u) => u.email === email);

  let userId: string;
  if (foundUser) {
    userId = foundUser.id;
  } else {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password: `QAE2E!${Date.now()}`,
        email_confirm: true,
        user_metadata: { full_name: opts.fullName ?? "QA Test Doctor" },
      });
    if (createErr || !created.user) {
      throw new Error(`Failed to create auth user: ${createErr?.message}`);
    }
    userId = created.user.id;
  }

  const { data: existingDoctor } = await admin
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingDoctor?.id) {
    return { userId, doctorId: existingDoctor.id, email };
  }

  const name = splitFullName(opts.fullName ?? "QA Test Doctor");
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    email,
    first_name: name.firstName,
    last_name: name.lastName,
    specialization: opts.specialization ?? "General Medicine",
    locale: opts.locale ?? "in",
    onboarding_completed: opts.onboardingCompleted ?? true,
  };
  if (opts.handle) {
    insertPayload.handle = opts.handle;
  }

  const { data: doctor, error: doctorErr } = await admin
    .from("larinova_doctors")
    .insert(insertPayload)
    .select("id")
    .single();
  if (doctorErr || !doctor) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`Failed to create doctor row: ${doctorErr?.message}`);
  }

  return { userId, doctorId: doctor.id, email };
}

export async function cleanupDoctor(
  admin: SupabaseClient,
  handle: DoctorHandle,
): Promise<void> {
  const { doctorId, userId } = handle;
  // Best-effort child deletes — some tables may not exist in every env.
  const cascades = [
    ["larinova_consultations", "doctor_id"],
    ["larinova_appointments", "doctor_id"],
    ["larinova_subscriptions", "doctor_id"],
    ["larinova_intake_templates", "doctor_id"],
    ["larinova_intake_submissions", "doctor_id"],
    ["larinova_patients", "created_by_doctor_id"],
    ["larinova_follow_up_threads", "doctor_id"],
  ] as const;
  for (const [table, col] of cascades) {
    await admin.from(table).delete().eq(col, doctorId);
  }
  await admin.from("larinova_doctors").delete().eq("id", doctorId);
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}

// ---- Direct cookie injection (bypasses broken client-side magic-link) ----
//
// The app's /[locale]/auth/callback is a "use client" page that relies on
// @supabase/ssr cookies already being present. Supabase's implicit-flow
// magic link puts tokens in the URL hash, but the client-side
// createBrowserClient does not auto-parse the hash into cookies. That makes
// E2E magic-link sign-in deterministic-failing.
//
// Instead we:
//   1. POST /auth/v1/token?grant_type=password with the provisioned password
//      to Supabase directly, and receive {access_token, refresh_token, user}.
//   2. Assemble the exact session JSON @supabase/auth-js stores.
//   3. Encode as `base64-${base64urlEncode(json)}` — the format
//      @supabase/ssr v0.x writes by default (cookieEncoding = "base64url").
//   4. Chunk if >3180 chars and write to Playwright's browser context via
//      `context.addCookies()`.
//
// Server components then read the cookies through @supabase/ssr and treat
// the user as authenticated exactly like a real login.

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function projectRef(): string {
  if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL unset");
  return new URL(SUPABASE_URL).host.split(".")[0];
}

interface SignInResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: "bearer";
  user: Record<string, unknown>;
}

async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL unset");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY unset");

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anon,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(
      `Supabase token grant failed ${res.status}: ${await res.text()}`,
    );
  }
  const json = await res.json();
  if (!json.access_token) {
    throw new Error(
      `Supabase returned no access_token: ${JSON.stringify(json)}`,
    );
  }
  return json as SignInResult;
}

function buildSessionCookies(
  session: SignInResult,
  originHost: string,
): Array<{ name: string; value: string; domain: string; path: string }> {
  const storageKey = `sb-${projectRef()}-auth-token`;
  const encoded = `base64-${base64UrlEncode(JSON.stringify(session))}`;

  // @supabase/ssr chunks values >3180 bytes as {key}.{i}. For a typical
  // JWT-bearing session the serialised value is ~2–3kb; chunk defensively.
  const MAX_CHUNK_SIZE = 3180;
  const chunks: Array<{ name: string; value: string }> = [];
  if (encoded.length <= MAX_CHUNK_SIZE) {
    chunks.push({ name: storageKey, value: encoded });
  } else {
    for (let i = 0, idx = 0; i < encoded.length; i += MAX_CHUNK_SIZE, idx++) {
      chunks.push({
        name: `${storageKey}.${idx}`,
        value: encoded.slice(i, i + MAX_CHUNK_SIZE),
      });
    }
  }

  return chunks.map((c) => ({
    ...c,
    domain: originHost,
    path: "/",
  }));
}

export async function signInViaMagicLink(
  page: Page,
  email: string,
  baseURL: string | undefined,
  locale: "in" | "id" = "in",
): Promise<void> {
  // Kept name for compatibility with prior call sites; now implemented via
  // direct cookie injection. We still navigate to /{locale} so the doctor
  // lands where the browser test expects.
  const password = await ensurePassword(email);
  const session = await signInWithPassword(email, password);

  const origin = baseURL ?? "http://localhost:3000";
  const host = new URL(origin).hostname;
  const cookies = buildSessionCookies(session, host);
  await page.context().addCookies(cookies);

  await page.goto(`${origin}/${locale}`);
  await page.waitForLoadState("networkidle");
}

// Deterministic password per email so signInWithPassword works even if the
// user was provisioned in a different test run. Mirrors the admin-side
// password we set in provisionDoctor.
const PASSWORD_SEED = "QAE2ESeed!2026";

async function ensurePassword(email: string): Promise<string> {
  const admin = adminClient();
  const { data: list } = await admin.auth.admin.listUsers();
  const u = list?.users?.find((x) => x.email === email);
  if (!u) throw new Error(`No auth user for ${email} — provision first`);
  // Always reset the password to the deterministic seed. This is idempotent
  // and guards against drift between runs.
  await admin.auth.admin.updateUserById(u.id, { password: PASSWORD_SEED });
  return PASSWORD_SEED;
}

/**
 * Persist the current authenticated browser state so other tests can reuse it.
 */
export async function saveStorageState(page: Page): Promise<void> {
  await page.context().storageState({ path: STORAGE_STATE_PATH });
}
