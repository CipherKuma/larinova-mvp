# Invite-Code Access System Implementation Plan

> **For agentic workers:** Pick ONE of three sanctioned execution paths:
> 1. **`superpowers:executing-plans`** — sequential execution with built-in checkpoints (default for most plans)
> 2. **cmux-teams** — parallel execution across 3+ independent workstreams via cmux tabs (see `~/.claude/rules/cmux-teams.md`)
> 3. **`superpowers:subagent-driven-development`** — fresh subagent per task, fastest iteration (for plans with clear task boundaries)
>
> **Fresh session guidance**: prefer a fresh Claude Code session for plans with 10+ tasks, schema migrations, or multi-module changes. This plan has 20 tasks + a schema migration → use a fresh session.
>
> **Testing flow**: this project (Next.js + Supabase) does not specify TDD. Per `app/CLAUDE.md`, the canonical flow is **implement → typecheck/build → Playwright/curl verify → commit**. Steps below follow that shape.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead-coded whitelist with a single-use invite-code gate that grants 30 days of Pro on redemption, then drops to Free. Rip every Indonesia/Xendit billing stub out of the codebase. Fix the AI feature usage limit so it resets monthly.

**Architecture:** New `larinova_invite_codes` table + `redeem_invite_code(p_code)` RPC that uses `auth.uid()` and atomically marks the code, sets `larinova_doctors.invite_code_redeemed_at`, and upserts a 30-day Pro `larinova_subscriptions` row. Middleware (`proxy.ts`) gates all not-yet-onboarded users behind a `/[locale]/redeem` page. Tier resolution gains a `current_period_end > now` check so Pro auto-expires without a cron. Existing onboarded users are grandfathered. All Xendit/IDR stubs deleted.

**Tech Stack:** Next.js (App Router) · Supabase (Postgres + Auth + RLS + RPC) · TypeScript · zod · next-intl · Resend · Playwright

**Project flow reference:** Read `/Users/gabrielantonyxaviour/Documents/products/larinova/app/CLAUDE.md` for project-specific conventions. Spec is at `docs/superpowers/specs/2026-04-25-invite-code-system-design.md`.

**Working directory for all tasks:** `/Users/gabrielantonyxaviour/Documents/products/larinova/app`

---

## File Structure

**New files:**
- `supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql` — schema + RPC
- `app/[locale]/redeem/page.tsx` — server shell, auth guard, redirect-if-redeemed
- `app/[locale]/redeem/RedeemForm.tsx` — client form + error states
- `app/api/invite/redeem/route.ts` — POST handler, zod validation, RPC dispatch, email
- `lib/invite.ts` — server helper wrapping the RPC + email send
- `tests/e2e/invite-redeem.spec.ts` — happy path + error paths

**Modified files:**
- `lib/subscription.ts` — `current_period_end` check; monthly filter on AI usage; remove whitelist comment
- `types/billing.ts` — drop `'whitelisted'` from `SubscriptionStatus`; drop `PLAN_PRICES.ID` and `'ID'` from `PricingRegion`
- `proxy.ts` — invite-code gate redirect for new users
- `lib/resend/email.ts` — re-key alpha-welcome template trigger
- `app/[locale]/(protected)/settings/billing/page.tsx` — remove `locale === 'id'` redirect
- `app/[locale]/(protected)/settings/billing/BillingClient.tsx` — remove ID region branches
- `components/razorpay-checkout.tsx` — strip `whitelisted` discriminant + branch
- `components/razorpay-checkout.test.ts` — remove `whitelisted_no_checkout` test
- `tests/e2e/billing.spec.ts` — drop whitelist tests; add expiry assertion
- `messages/in.json` — add `redeem.*` keys
- `messages/id.json` — add `redeem.*` keys (parity, even though Indonesia is deferred)
- `APPLY_MIGRATIONS.sql` — clean stale entries

**Deleted:**
- `app/api/xendit/` — entire directory (3 routes)

---

## Task 1: Write the migration SQL

**Files:**
- Create: `supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql` with exactly this content:

```sql
-- ============================================================================
-- Invite-code access system + drop whitelisted enum value
-- Spec: docs/superpowers/specs/2026-04-25-invite-code-system-design.md
-- ============================================================================

-- 1. Drop "whitelisted" from larinova_subscriptions.status enum
ALTER TABLE larinova_subscriptions
  DROP CONSTRAINT IF EXISTS larinova_subscriptions_status_check;
ALTER TABLE larinova_subscriptions
  ADD CONSTRAINT larinova_subscriptions_status_check
    CHECK (status IN ('active','canceled','past_due','trialing'));

-- Defensive: downgrade any whitelisted rows to active (expected count: 0).
UPDATE larinova_subscriptions SET status = 'active' WHERE status = 'whitelisted';

-- 2. Invite codes table
CREATE TABLE IF NOT EXISTS larinova_invite_codes (
  code         TEXT PRIMARY KEY,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at  TIMESTAMPTZ,
  CONSTRAINT redeemed_pair_consistent
    CHECK ((redeemed_by IS NULL) = (redeemed_at IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_larinova_invite_codes_redeemed_by
  ON larinova_invite_codes (redeemed_by) WHERE redeemed_by IS NOT NULL;

ALTER TABLE larinova_invite_codes ENABLE ROW LEVEL SECURITY;
-- No user-facing policies. The redeem_invite_code RPC (SECURITY DEFINER)
-- is the only path that touches this table from the app.

-- 3. Doctor row gains the gate signal
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS invite_code_redeemed_at TIMESTAMPTZ;

-- 4. Atomic redemption RPC. Uses auth.uid() — never trusts client-supplied
-- user ids. SECURITY DEFINER so it can write to tables RLS would otherwise
-- block, but the identity it acts on is always the caller's auth.uid().
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_now        TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := v_now + INTERVAL '30 days';
  v_already    TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Idempotency: if this user already redeemed any code, succeed silently.
  SELECT invite_code_redeemed_at INTO v_already
    FROM larinova_doctors WHERE user_id = v_user_id;
  IF v_already IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_redeemed', true);
  END IF;

  -- Lock the code row, fail if missing or used.
  PERFORM 1 FROM larinova_invite_codes
   WHERE code = p_code AND redeemed_by IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_code' USING ERRCODE = 'P0001';
  END IF;

  UPDATE larinova_invite_codes
     SET redeemed_by = v_user_id, redeemed_at = v_now
   WHERE code = p_code;

  UPDATE larinova_doctors
     SET invite_code_redeemed_at = v_now
   WHERE user_id = v_user_id;

  -- Upsert subscription: 30 days of Pro. GREATEST() never shortens
  -- access if a longer period_end already exists.
  INSERT INTO larinova_subscriptions (doctor_id, plan, status, current_period_end)
  SELECT id, 'pro', 'active', v_period_end
    FROM larinova_doctors WHERE user_id = v_user_id
  ON CONFLICT (doctor_id) DO UPDATE
    SET plan = 'pro',
        status = 'active',
        current_period_end = GREATEST(
          larinova_subscriptions.current_period_end,
          EXCLUDED.current_period_end
        );

  RETURN jsonb_build_object('ok', true, 'period_end', v_period_end);
END;
$$;

REVOKE ALL ON FUNCTION redeem_invite_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_invite_code(TEXT) TO authenticated;
```

- [ ] **Step 2: Sanity-check SQL parses**

Run from `app/`:
```bash
test -f supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql && \
  grep -c "redeem_invite_code" supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql
```
Expected: prints `4` (function name appears 4 times: definition + 2 grants + comment).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql
git commit -m "feat(db): invite_codes table, redeem RPC, drop whitelisted status"
```

---

## Task 2: Apply migration to local Supabase

**Files:** none (DB-only)

- [ ] **Step 1: Apply via Supabase CLI**

Run from `app/`:
```bash
npx supabase db push
```
If the project uses `supabase migration up` instead, use that. Confirm by reading `app/CLAUDE.md` if unsure.

Expected: `Finished supabase db push.` with the new migration in the applied list.

- [ ] **Step 2: Verify schema**

```bash
npx supabase db remote inspect | grep -E "larinova_invite_codes|invite_code_redeemed_at" || true
```
Expected: at least 2 hits — the new table and the new column.

- [ ] **Step 3: Verify RPC exists**

Run a quick psql round-trip via Supabase:
```bash
npx supabase db sql "SELECT proname FROM pg_proc WHERE proname = 'redeem_invite_code';"
```
Expected: one row with `redeem_invite_code`.

- [ ] **Step 4: No commit needed** (DB-side change verified; source of truth is the migration file already committed in Task 1).

---

## Task 3: Drop whitelisted + ID from `types/billing.ts`

**Files:**
- Modify: `app/types/billing.ts`

- [ ] **Step 1: Edit the file**

In `types/billing.ts`, find:
```ts
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "whitelisted";
```
Replace with:
```ts
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";
```

In the same file, find:
```ts
export type PricingRegion = "IN" | "ID" | "default";
```
Replace with:
```ts
export type PricingRegion = "IN" | "default";
```

In the same file, find the `ID:` block inside `PLAN_PRICES`:
```ts
  ID: {
    currency: "IDR",
    symbol: "Rp",
    month: { amount: 29900000, label: "Rp 299,000/month" },
    year: {
      amount: 299000000,
      label: "Rp 2,990,000/year",
      savings: "Rp 598,000",
    },
  },
```
Delete the entire `ID:` block (including the trailing comma).

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: errors will surface in the billing UI files (`BillingClient.tsx`, etc.) referencing `region === "ID"` or `'whitelisted'`. **Do not fix them yet** — those are addressed in later tasks. Note the failing files for cross-reference but proceed.

- [ ] **Step 3: Commit**

```bash
git add types/billing.ts
git commit -m "refactor(types): drop ID pricing region and whitelisted subscription status"
```

---

## Task 4: Update `lib/subscription.ts` — period_end check + monthly AI usage

**Files:**
- Modify: `app/lib/subscription.ts`

- [ ] **Step 1: Edit the consultation tier check**

In `lib/subscription.ts::checkConsultationLimit`, find lines 41–50:
```ts
  const subscription = await getSubscription(doctorId);
  const plan: PlanType = subscription?.plan ?? "free";
  const status = subscription?.status ?? "active";

  // Pro access granted only while the Razorpay subscription is active. The
  // previous "whitelisted" bypass is gone — alpha doctors get Pro for 1
  // billing cycle via the Razorpay 100%-off promo offer instead.
  if (plan === "pro" && status === "active") {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }
```
Replace with:
```ts
  const subscription = await getSubscription(doctorId);
  const plan: PlanType = subscription?.plan ?? "free";
  const status = subscription?.status ?? "active";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  if (
    plan === "pro" &&
    status === "active" &&
    periodEnd !== null &&
    periodEnd > now
  ) {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }
```

- [ ] **Step 2: Edit the AI tier check**

In the same file, find `checkAIUsage` (lines 87–107):
```ts
  if (plan === "pro" && subscription?.status === "active") {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }
```
Replace with:
```ts
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const now = new Date();
  if (
    plan === "pro" &&
    subscription?.status === "active" &&
    periodEnd !== null &&
    periodEnd > now
  ) {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }
```

- [ ] **Step 3: Make `getUsageCount` monthly**

Find `getUsageCount` (lines 74–85). The current body:
```ts
export async function getUsageCount(
  doctorId: string,
  feature: AIFeature,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("larinova_ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("feature", feature);
  return count ?? 0;
}
```
Replace with:
```ts
export async function getUsageCount(
  doctorId: string,
  feature: AIFeature,
  now: Date = new Date(),
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("larinova_ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("feature", feature)
    .gte("created_at", startOfMonthUtcISO(now));
  return count ?? 0;
}
```

Then update the caller in `checkAIUsage`:
```ts
  const used = await getUsageCount(doctorId, feature);
```
Becomes:
```ts
  const used = await getUsageCount(doctorId, feature, now);
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit lib/subscription.ts
```
Expected: no errors in `lib/subscription.ts`.

- [ ] **Step 5: Commit**

```bash
git add lib/subscription.ts
git commit -m "feat(billing): tier check respects current_period_end; AI usage resets monthly"
```

---

## Task 5: Create `lib/invite.ts` redemption helper

**Files:**
- Create: `app/lib/invite.ts`

- [ ] **Step 1: Create the helper**

Create `lib/invite.ts` with:
```ts
import { SupabaseClient } from "@supabase/supabase-js";

export type RedeemResult =
  | { ok: true; period_end: string; already_redeemed: boolean }
  | { ok: false; error: "invalid_or_used_code" | "unauthenticated" | "unknown" };

export async function redeemInviteCode(
  supabase: SupabaseClient,
  code: string,
): Promise<RedeemResult> {
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("invalid_or_used_code")) {
      return { ok: false, error: "invalid_or_used_code" };
    }
    if (msg.includes("unauthenticated")) {
      return { ok: false, error: "unauthenticated" };
    }
    return { ok: false, error: "unknown" };
  }

  return {
    ok: true,
    period_end: data?.period_end ?? "",
    already_redeemed: Boolean(data?.already_redeemed),
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit lib/invite.ts
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/invite.ts
git commit -m "feat(invite): server helper to redeem invite codes via RPC"
```

---

## Task 6: Create `POST /api/invite/redeem` route

**Files:**
- Create: `app/app/api/invite/redeem/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/invite/redeem/route.ts` with:
```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redeemInviteCode } from "@/lib/invite";
import { sendAlphaWelcomeEmail } from "@/lib/resend/email";

const Body = z.object({
  code: z.string().trim().min(6).max(40),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const result = await redeemInviteCode(supabase, parsed.code.toUpperCase());

  if (!result.ok) {
    const status = result.error === "unauthenticated" ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (!result.already_redeemed) {
    try {
      await sendAlphaWelcomeEmail({
        to: user.email!,
        periodEnd: result.period_end,
      });
    } catch (e) {
      console.error("[invite/redeem] email send failed:", e);
      // RPC is the source of truth; redemption stands.
    }
  }

  return NextResponse.json({
    ok: true,
    period_end: result.period_end,
    already_redeemed: result.already_redeemed,
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: ONE error in this file referencing `sendAlphaWelcomeEmail` not being exported. That's resolved in Task 10. Proceed.

- [ ] **Step 3: Commit**

```bash
git add app/api/invite/redeem/route.ts
git commit -m "feat(api): POST /api/invite/redeem with zod validation"
```

---

## Task 7: i18n keys for the redeem page

**Files:**
- Modify: `app/messages/in.json`
- Modify: `app/messages/id.json`

- [ ] **Step 1: Add keys to `messages/in.json`**

At the top level of the JSON object (alongside `"common"`, `"auth"`, etc.), add:
```json
"redeem": {
  "title": "Enter your invite code",
  "subtitle": "Larinova is invite-only during alpha. Paste the code we sent you to unlock 30 days of Pro.",
  "label": "Invite code",
  "placeholder": "LARINOVA-XXXXX",
  "submit": "Redeem code",
  "submitting": "Redeeming…",
  "errorInvalid": "That code is invalid or has already been used.",
  "errorMalformed": "Code looks malformed. Check the email we sent and try again.",
  "errorUnauthenticated": "Your session expired. Please sign in again.",
  "errorUnknown": "Something went wrong. Please try again.",
  "successTitle": "You're in.",
  "successBody": "30 days of Pro starts now."
}
```

- [ ] **Step 2: Add keys to `messages/id.json`**

In `messages/id.json`, add the same shape at the top level. For Indonesian (parity placeholder, can be properly translated later — Indonesia is deferred):
```json
"redeem": {
  "title": "Masukkan kode undangan Anda",
  "subtitle": "Larinova bersifat undangan selama alpha. Tempel kode yang kami kirimkan untuk membuka 30 hari Pro.",
  "label": "Kode undangan",
  "placeholder": "LARINOVA-XXXXX",
  "submit": "Tukarkan kode",
  "submitting": "Memproses…",
  "errorInvalid": "Kode ini tidak valid atau sudah digunakan.",
  "errorMalformed": "Format kode tidak benar. Periksa email yang kami kirim dan coba lagi.",
  "errorUnauthenticated": "Sesi Anda berakhir. Silakan masuk kembali.",
  "errorUnknown": "Terjadi kesalahan. Silakan coba lagi.",
  "successTitle": "Berhasil masuk.",
  "successBody": "30 hari Pro dimulai sekarang."
}
```

- [ ] **Step 3: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/in.json','utf8')); JSON.parse(require('fs').readFileSync('messages/id.json','utf8')); console.log('valid')"
```
Expected: `valid`.

- [ ] **Step 4: Commit**

```bash
git add messages/in.json messages/id.json
git commit -m "feat(i18n): add redeem.* keys for invite-code page"
```

---

## Task 8: Create `/[locale]/redeem/page.tsx` server shell

**Files:**
- Create: `app/app/[locale]/redeem/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/[locale]/redeem/page.tsx` with:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RedeemForm } from "./RedeemForm";

export const dynamic = "force-dynamic";

type Params = { locale: string };

export default async function RedeemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // If already redeemed, skip the page.
  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("invite_code_redeemed_at, onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (doctor?.invite_code_redeemed_at) {
    redirect(
      doctor.onboarding_completed ? `/${locale}` : `/${locale}/onboarding`,
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <RedeemForm locale={locale} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: error referencing `./RedeemForm` (file not yet created). That resolves in Task 9. Proceed.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/redeem/page.tsx
git commit -m "feat(app): /[locale]/redeem server page with auth + already-redeemed bypass"
```

---

## Task 9: Create `RedeemForm.tsx` client component

**Files:**
- Create: `app/app/[locale]/redeem/RedeemForm.tsx`

- [ ] **Step 1: Create the form**

Create `app/[locale]/redeem/RedeemForm.tsx` with:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ApiError =
  | "invalid_or_used_code"
  | "invalid_input"
  | "unauthenticated"
  | "unknown";

export function RedeemForm({ locale }: { locale: string }) {
  const t = useTranslations("redeem");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorMessage(e: ApiError): string {
    switch (e) {
      case "invalid_or_used_code":
        return t("errorInvalid");
      case "invalid_input":
        return t("errorMalformed");
      case "unauthenticated":
        return t("errorUnauthenticated");
      default:
        return t("errorUnknown");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const body = await res.json();
      if (!res.ok || !body?.ok) {
        setError((body?.error as ApiError) ?? "unknown");
        setSubmitting(false);
        return;
      }
      router.push(`/${locale}/onboarding`);
    } catch {
      setError("unknown");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-code">{t("label")}</Label>
        <Input
          id="invite-code"
          name="invite-code"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={t("placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={submitting}
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage(error)}
          </p>
        )}
      </div>
      <Button type="submit" disabled={submitting || code.trim().length < 6}>
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors in the redeem flow files. (Email helper error from Task 6 still pending — resolves in Task 10.)

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/redeem/RedeemForm.tsx
git commit -m "feat(app): redeem form client component with i18n error states"
```

---

## Task 10: Re-key alpha welcome email + export sender

**Files:**
- Modify: `app/lib/resend/email.ts`

- [ ] **Step 1: Read the current alpha welcome block**

```bash
grep -n "Alpha Welcome\|sendAlphaWelcomeEmail\|alpha doctor" lib/resend/email.ts
```
Note the function name and its signature. Two cases:
- **(a)** A function `sendAlphaWelcomeEmail` already exists with some signature. Update the export and adjust the body to take `{ to, periodEnd }`.
- **(b)** The template is inline (no exported function). Wrap it in an exported function.

- [ ] **Step 2: Ensure the file exports `sendAlphaWelcomeEmail`**

The route handler in Task 6 imports:
```ts
import { sendAlphaWelcomeEmail } from "@/lib/resend/email";
```
The function must accept `{ to: string; periodEnd: string }` and send via Resend with subject `"Welcome to Larinova, alpha doctor"` and the existing body text. If the existing template references "whitelisted" anywhere in copy, replace with "alpha invite". The body should mention `periodEnd` formatted as a human-readable date (e.g. `new Date(periodEnd).toLocaleDateString("en-IN", { dateStyle: "long" })`). Sender remains the project default (per `feedback_email_sender_domain.md`, **do not change the sender**; leave it as whatever it was).

Replacement template body section:
```
You're one of our very first alpha doctors. Thank you for shaping Larinova.

Your account has 30 days of Pro — unlimited consults, all features unlocked.
After ${formattedDate} your account drops to the Free tier (20 consultations/month).
You can subscribe via your billing page anytime.

We're listening. Reply to this email with feedback, bugs, or feature wishes.

— Gabriel, founder
```

Concretely, around line 362 (`// ─── Alpha Welcome (whitelisted pro doctor, first login) ──`), replace the comment with `// ─── Alpha Welcome (invite-code redemption) ──` and rewrite the function so its signature matches:
```ts
export async function sendAlphaWelcomeEmail({
  to,
  periodEnd,
}: {
  to: string;
  periodEnd: string;
}): Promise<void> {
  const formattedDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-IN", { dateStyle: "long" })
    : "";
  // ... existing Resend call, with subject and body updated as above ...
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: zero errors anywhere in the project (the route handler from Task 6 now resolves).

- [ ] **Step 4: Commit**

```bash
git add lib/resend/email.ts
git commit -m "feat(email): re-key alpha welcome to fire on invite redemption"
```

---

## Task 11: Wire the invite gate into `proxy.ts`

**Files:**
- Modify: `app/proxy.ts`

- [ ] **Step 1: Extend the doctor select**

In `proxy.ts` around line 116, find:
```ts
    const { data: doctorData, error: doctorError } = await supabase
      .from("larinova_doctors")
      .select("onboarding_completed, locale")
      .eq("user_id", user.id)
      .single();
```
Replace the `.select(...)` argument:
```ts
      .select("onboarding_completed, locale, invite_code_redeemed_at")
```

- [ ] **Step 2: Insert the redeem gate**

After the existing `if (doctorError || !doctorData) { ... redirect /onboarding }` block (around line 128), and **before** the existing `if (!doctorData.onboarding_completed) { ... redirect /onboarding }` block, insert:
```ts
    // Invite-code gate: not-yet-onboarded users must redeem before reaching
    // /onboarding. Already-onboarded users are grandfathered.
    if (
      !doctorData.onboarding_completed &&
      !doctorData.invite_code_redeemed_at &&
      !pathname.includes("/redeem")
    ) {
      redirectUrl.pathname = `/${locale}/redeem`;
      return NextResponse.redirect(redirectUrl);
    }
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit proxy.ts
```
Expected: no errors.

- [ ] **Step 4: Verify in dev**

Start dev server (skip if already running). In a new terminal:
```bash
pnpm dev || npm run dev
```
With a fresh Supabase auth session that has no doctor row, navigate to any protected route. You should land on `/{locale}/redeem`. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add proxy.ts
git commit -m "feat(middleware): redirect not-onboarded users with no invite to /redeem"
```

---

## Task 12: Delete `app/api/xendit/` entirely

**Files:**
- Delete: `app/app/api/xendit/` (whole directory)

- [ ] **Step 1: Confirm contents before deleting**

```bash
ls -R app/api/xendit/
```
Expected: 3 subdirectories (`create-subscription`, `verify`, `webhook`), each containing `route.ts`.

- [ ] **Step 2: Delete the directory**

```bash
git rm -r app/api/xendit/
```

- [ ] **Step 3: Verify**

```bash
test ! -d app/api/xendit && echo "gone"
git grep -i "xendit" app/ lib/ types/ proxy.ts || echo "no remaining xendit references in source"
```
Expected: prints `gone` and `no remaining xendit references in source`.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete Xendit stub routes (Indonesia billing deferred)"
```

---

## Task 13: Remove the `id` locale redirect in billing page

**Files:**
- Modify: `app/app/[locale]/(protected)/settings/billing/page.tsx`

- [ ] **Step 1: Edit the file**

In `app/[locale]/(protected)/settings/billing/page.tsx`, find the block around line 11:
```ts
  if (locale === "id") {
    redirect({ href: "/", locale: "id" });
  }
```
Delete the entire `if` block.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: errors will surface in `BillingClient.tsx` from the prior `PLAN_PRICES.ID` removal. Proceed — Task 14 fixes them.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/\(protected\)/settings/billing/page.tsx
git commit -m "chore(billing): remove id-locale redirect; billing is IN/default only"
```

---

## Task 14: Strip ID region branches from `BillingClient.tsx`

**Files:**
- Modify: `app/app/[locale]/(protected)/settings/billing/BillingClient.tsx`

- [ ] **Step 1: Inventory ID references**

```bash
grep -n '"ID"\|region === "ID"\|PLAN_PRICES\.ID\|locale === "id"\|locale === '\''id'\''' \
  app/\[locale\]/\(protected\)/settings/billing/BillingClient.tsx
```
Note every line — each must be removed or simplified.

- [ ] **Step 2: Delete every ID branch**

For every block matching `if (locale === "id" || ...)`, `region === "ID"`, ternaries selecting IDR labels, etc., remove the ID arm. The component should only ever resolve to `region: "IN" | "default"`.

If there's a `getRegionFromLocale(locale)` helper or similar, remove the `id` case. If region detection still falls back to a geo API for non-IN, leave that alone — only the explicit ID branch is being deleted.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors anywhere.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/\(protected\)/settings/billing/BillingClient.tsx
git commit -m "chore(billing): remove ID region branches from BillingClient"
```

---

## Task 15: Strip whitelist branches from razorpay-checkout

**Files:**
- Modify: `app/components/razorpay-checkout.tsx`
- Modify: `app/components/razorpay-checkout.test.ts`

- [ ] **Step 1: Edit `razorpay-checkout.tsx`**

Find the discriminated union (around line 116):
```ts
  | { kind: "whitelisted" }
```
Delete that line.

Find the body parsing branch (around lines 126–127):
```ts
    if (body?.error === "whitelisted_no_checkout") {
      return { kind: "whitelisted" };
    }
```
Delete the entire `if` block.

Find the switch arm (around lines 182–183):
```ts
        case "whitelisted":
          toast.success("You're on the alpha Pro plan — no checkout needed.");
          break;
```
Delete the entire `case`.

If the same file has any other `whitelist`/`whitelisted` reference, delete it.

- [ ] **Step 2: Edit `razorpay-checkout.test.ts`**

Find the test (around line 34):
```ts
  it("maps 409 whitelisted_no_checkout → whitelisted", async () => {
    ...
    expect(r.kind).toBe("whitelisted");
  });
```
Delete the entire `it(...)` block.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/razorpay-checkout.tsx components/razorpay-checkout.test.ts
git commit -m "chore: remove whitelisted branches from razorpay-checkout"
```

---

## Task 16: Update `tests/e2e/billing.spec.ts` (drop whitelist + add expiry)

**Files:**
- Modify: `app/tests/e2e/billing.spec.ts`

- [ ] **Step 1: Inventory whitelist tests**

```bash
grep -n "whitelist\|whitelisted" tests/e2e/billing.spec.ts
```
Note every line. Each test that references `status: "whitelisted"` or "Alpha Pro UI" must be deleted.

- [ ] **Step 2: Delete those tests**

Open the file and delete every `test(...)` block that asserts whitelist behavior. Keep tests that assert Free vs Pro visibility, usage cards, and the upgrade modal — those still apply.

- [ ] **Step 3: Add an expiry test**

Append a new `test(...)` block that:
1. Inserts a row into `larinova_subscriptions` with `plan: 'pro'`, `status: 'active'`, `current_period_end: 1 day in the past` for the test doctor (use the existing test fixture for DB setup).
2. Loads the billing page.
3. Asserts the page shows the Free tier UI (usage card with `0/20 used this month`), not the Pro card.

Concrete test skeleton (adapt to existing patterns in the file — DB setup + auth helpers will mirror surrounding tests):
```ts
test("expired Pro subscription falls back to Free tier on billing page", async ({
  page,
  testDoctor,
  supabaseAdmin,
}) => {
  await supabaseAdmin
    .from("larinova_subscriptions")
    .upsert({
      doctor_id: testDoctor.id,
      plan: "pro",
      status: "active",
      current_period_end: new Date(Date.now() - 86_400_000).toISOString(),
    });

  await page.goto(`/in/settings/billing`);
  await expect(page.getByText("Free")).toBeVisible();
  await expect(page.getByText(/used this month/i)).toBeVisible();
});
```
If `testDoctor` / `supabaseAdmin` aren't fixture names in this project, use whatever the surrounding tests use (read 30 lines of context above the insertion point first).

- [ ] **Step 4: Run the spec**

```bash
npx playwright test tests/e2e/billing.spec.ts --project=chromium
```
Expected: all assertions pass, including the new expiry test.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/billing.spec.ts
git commit -m "test(billing): drop whitelist tests; add Pro expiry → Free fallback test"
```

---

## Task 17: New Playwright spec for invite redemption

**Files:**
- Create: `app/tests/e2e/invite-redeem.spec.ts`

- [ ] **Step 1: Create the spec**

The exact auth/DB fixtures depend on patterns already in `tests/e2e/`. Read 50 lines of `tests/e2e/billing.spec.ts` (or any sibling spec) first to see how `testDoctor`, `supabaseAdmin`, and login helpers are wired. Then create `tests/e2e/invite-redeem.spec.ts` with these scenarios, adapted to the project's fixtures:

```ts
import { test, expect } from "@playwright/test";

test.describe("invite-code redemption", () => {
  test("new user is redirected to /redeem after sign-in", async ({
    page,
    freshUser,
    supabaseAdmin,
  }) => {
    // Insert a code we can use later
    await supabaseAdmin.from("larinova_invite_codes").insert({
      code: "TEST-A1B2",
      note: "playwright happy path",
    });
    await freshUser.signIn();
    await page.goto("/in");
    await expect(page).toHaveURL(/\/in\/redeem$/);
  });

  test("invalid code shows error, stays on /redeem", async ({
    page,
    freshUser,
  }) => {
    await freshUser.signIn();
    await page.goto("/in/redeem");
    await page.getByLabel(/invite code/i).fill("NOT-A-REAL-CODE");
    await page.getByRole("button", { name: /redeem/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/in\/redeem$/);
  });

  test("valid code grants 30-day Pro and redirects to onboarding", async ({
    page,
    freshUser,
    supabaseAdmin,
  }) => {
    await supabaseAdmin.from("larinova_invite_codes").insert({
      code: "TEST-C3D4",
      note: "playwright happy path",
    });
    await freshUser.signIn();
    await page.goto("/in/redeem");
    await page.getByLabel(/invite code/i).fill("TEST-C3D4");
    await page.getByRole("button", { name: /redeem/i }).click();
    await expect(page).toHaveURL(/\/in\/onboarding$/);

    const { data: sub } = await supabaseAdmin
      .from("larinova_subscriptions")
      .select("plan, status, current_period_end")
      .eq("doctor_id", freshUser.doctorId)
      .single();
    expect(sub?.plan).toBe("pro");
    expect(sub?.status).toBe("active");
    expect(new Date(sub!.current_period_end!).getTime()).toBeGreaterThan(
      Date.now() + 29 * 86_400_000,
    );
  });

  test("already-onboarded user never sees /redeem", async ({
    page,
    onboardedDoctor,
  }) => {
    await onboardedDoctor.signIn();
    await page.goto("/in/redeem");
    await expect(page).not.toHaveURL(/\/in\/redeem$/);
  });

  test("already-redeemed user is bounced from /redeem to /onboarding", async ({
    page,
    redeemedNotOnboardedDoctor,
  }) => {
    await redeemedNotOnboardedDoctor.signIn();
    await page.goto("/in/redeem");
    await expect(page).toHaveURL(/\/in\/onboarding$/);
  });
});
```

If the project doesn't have `freshUser` / `onboardedDoctor` / `redeemedNotOnboardedDoctor` fixtures, create them (or wire the equivalent) following the patterns in `tests/e2e/auth.setup.ts` and `tests/doctor-journey.spec.ts`.

- [ ] **Step 2: Run the spec**

```bash
npx playwright test tests/e2e/invite-redeem.spec.ts --project=chromium
```
Expected: all 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/invite-redeem.spec.ts
git commit -m "test(invite): full E2E suite for redeem flow"
```

---

## Task 18: Clean `APPLY_MIGRATIONS.sql` of stale whitelist entries

**Files:**
- Modify: `app/APPLY_MIGRATIONS.sql`

- [ ] **Step 1: Find whitelist references**

```bash
grep -n -i "whitelist\|whitelisted" APPLY_MIGRATIONS.sql
```
For each match, decide: if the line is part of an old `ALTER TABLE ... CHECK (status IN (..., 'whitelisted'))`, delete that block (the new migration replaces it). If the file is purely a record of historical applied migrations and has no operational role, leave the historical lines but add a comment noting the new migration supersedes them.

- [ ] **Step 2: Append a marker for the new migration**

At the bottom of `APPLY_MIGRATIONS.sql`, append:
```sql

-- 2026-04-25: Invite-code system + drop whitelisted status
-- See: supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql
```

- [ ] **Step 3: Commit**

```bash
git add APPLY_MIGRATIONS.sql
git commit -m "chore: clean APPLY_MIGRATIONS.sql whitelist refs; mark invite migration"
```

---

## Task 19: Seed 5 pilot codes

**Files:** none (DB-only)

- [ ] **Step 1: Run the seed against production Supabase**

In the Supabase SQL editor (or via `npx supabase db sql`):
```sql
INSERT INTO larinova_invite_codes (code, note) VALUES
  ('LARINOVA-A7K9', 'Pilot doctor 1'),
  ('LARINOVA-B3M2', 'Pilot doctor 2'),
  ('LARINOVA-C9P4', 'Pilot doctor 3'),
  ('LARINOVA-D1X7', 'Pilot doctor 4'),
  ('LARINOVA-E5Q8', 'Pilot doctor 5');

SELECT code, note FROM larinova_invite_codes WHERE redeemed_by IS NULL;
```
Expected: 5 rows returned.

- [ ] **Step 2: Hand the codes to Gabriel**

Print the codes in chat so they can be pasted into the pilot doctor invitation emails. Do NOT commit them to the repo.

- [ ] **Step 3: No commit needed.**

---

## Task 20: Final verification (build, typecheck, full E2E, prod smoke)

**Files:** none

- [ ] **Step 1: Full typecheck**

```bash
npx tsc --noEmit
```
Expected: zero errors across the project.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: no errors. Warnings about migrations or generated files are acceptable.

- [ ] **Step 3: Production build**

```bash
npm run build
```
Expected: build completes; no type errors; `/[locale]/redeem` and `/api/invite/redeem` appear in the route manifest.

- [ ] **Step 4: Full Playwright suite**

```bash
npm run test:e2e
```
Expected: all specs pass, including `tests/e2e/invite-redeem.spec.ts` and the updated `tests/e2e/billing.spec.ts`.

- [ ] **Step 5: Verify no stubs left in source**

```bash
git grep -i "xendit\|whitelist\|whitelisted\|PRO_WHITELIST" -- ':!supabase/migrations/*' ':!docs/*'
```
Expected: zero results outside of migrations/docs (migrations are immutable history).

- [ ] **Step 6: Push to deploy**

```bash
git push origin main
```
Wait for Vercel to deploy. Use:
```bash
vercel ls larinova-mvp --token $VERCEL_TOKEN | head -5
```
or the project's standard deploy-status check, until the latest deploy is `Ready`.

- [ ] **Step 7: Production smoke test**

Using Playwright CLI sessions on the M2 worker (per `~/.claude/rules/testing-rules.md`):
1. Sign in as a fresh test doctor (no existing row in `larinova_doctors`).
2. Confirm redirect to `https://app.larinova.com/in/redeem`.
3. Submit a real seeded code (e.g. `LARINOVA-A7K9` if not yet given to a pilot).
4. Confirm redirect to `/in/onboarding`.
5. Confirm `larinova_subscriptions` row for that doctor: `plan='pro'`, `status='active'`, `current_period_end ≈ now+30d`.
6. Confirm "Welcome to Larinova, alpha doctor" email arrived in the test inbox.
7. Screenshot to `/tmp/verify/invite-redeem-prod.png`.

If any step fails, do not proceed — fix forward, push, redeploy, retest.

- [ ] **Step 8: No commit needed (verification only).**

---

## Self-review checklist

Before handing off:

- [ ] Every task in the spec's §5 Architecture, §5.6 Stub & whitelist cleanup, §8 Testing, and §9 Definition of done has a corresponding plan task.
- [ ] No "TODO" / "TBD" / "fill in" placeholders.
- [ ] Function signatures match between tasks (`sendAlphaWelcomeEmail({to, periodEnd})`, `redeemInviteCode(supabase, code)`, `redeem_invite_code(p_code TEXT)`).
- [ ] All file paths are absolute or unambiguously relative to the working directory `/Users/gabrielantonyxaviour/Documents/products/larinova/app`.
- [ ] Each step that changes code shows the actual code; each verify step shows the actual command and expected output.
- [ ] Commit messages are scoped and descriptive.

---

## Risks the executor should watch for

- **Resend sender domain**: per memory `feedback_email_sender_domain.md`, do NOT change the email sender to `@larinova.com`. Leave it as the existing project default.
- **Supabase migration ordering**: migration `20260425120000` lands AFTER `20260423100100_extend_larinova_subscriptions_whitelisted_status.sql`. Both must be applied; the new one supersedes the old at the schema level.
- **`auth.uid()` in the RPC**: the RPC must be called via a Supabase client carrying the authenticated user's JWT. The route handler uses `createClient()` from `@/lib/supabase/server`, which does this. Never call the RPC from a service-role client unless you also pass `headers: { Authorization: ... }`, or the RPC will see `auth.uid() = NULL` and throw `unauthenticated`.
- **i18n fallback**: if `id.json` keys are missing, next-intl throws and the page errors out. Both locales must have the `redeem.*` keys even though Indonesia is deferred.
- **Existing Razorpay webhook**: when a redeemed user later subscribes via Razorpay, the existing webhook (`/api/razorpay/webhook`) overwrites `current_period_end` to Razorpay's value. That's correct — the spec calls this out in §10.
