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

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    email,
    full_name: opts.fullName ?? "QA Test Doctor",
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
    ["larinova_patients", "doctor_id"],
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

/**
 * Sign a provisioned doctor in by generating a magic link via the Supabase
 * admin API and navigating to it. Mirrors the pattern used in
 * `tests/doctor-journey.spec.ts` — no real email delivery required.
 */
export async function signInViaMagicLink(
  page: Page,
  email: string,
  baseURL: string | undefined,
  locale: "in" | "id" = "in",
): Promise<void> {
  const admin = adminClient();
  const origin = baseURL ?? "http://localhost:3000";
  const redirectTo = `${origin}/${locale}/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error || !data?.properties?.action_link) {
    throw new Error(`Failed to generate magic link: ${error?.message}`);
  }

  await page.goto(data.properties.action_link);
  await page.waitForURL(new RegExp(`\\/${locale}(\\/|$|\\?)`), {
    timeout: 30_000,
  });
  await page.waitForLoadState("networkidle");
}

/**
 * Persist the current authenticated browser state so other tests can reuse it.
 */
export async function saveStorageState(page: Page): Promise<void> {
  await page.context().storageState({ path: STORAGE_STATE_PATH });
}
