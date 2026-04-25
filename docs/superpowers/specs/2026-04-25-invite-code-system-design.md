# Invite-Code Access System + Stub Cleanup

**Date:** 2026-04-25
**Author:** Gabriel Antony Xaviour
**Scope:** App at `app.larinova.com` (`/Users/gabrielantonyxaviour/Documents/products/larinova/app`)
**Supersedes (partially):** `docs/superpowers/specs/2026-04-23-india-opd-platform-design.md` §Tiering / §Pilot

---

## 1. Goal

Replace the dead-coded "whitelist" mechanism with an **invite-code gate**: nobody can use the app without redeeming a code. Each redemption grants **30 days of Pro for free**, after which the account drops to the standard Free tier (20 consultations/month). At the same time, **rip every Indonesia / Xendit billing stub out of the codebase** — `app.larinova.com` is India-only on the billing axis until further notice.

## 2. Why

- The `PRO_WHITELIST` array and the `larinova_subscriptions.status='whitelisted'` enum are leftover from an earlier design. The array has already been deleted from `lib/subscription.ts`, but the schema enum and a stale comment remain. The migration that added it (`20260423100100_extend_larinova_subscriptions_whitelisted_status.sql`) is dead weight.
- Pilot doctors need controlled access (5 today, more later) without an open signup. An invite code is the simplest, durable mechanism.
- Granting 30 days of Pro replaces the "alpha welcome" intent of the whitelist with a real billing-aware mechanism that expires naturally.
- Indonesia billing is explicitly **out of scope** in the active OPD spec. The Xendit routes return 501, the locale-id billing redirect is dead UX, and IDR pricing in `PLAN_PRICES` is display-only with no path to checkout. All of it is stub code that confuses readers and risks accidental wiring later.

## 3. Decided

- **Code lifecycle:** single-use. Each code redeems exactly once.
- **Code → tier:** redemption sets `plan='pro'`, `status='active'`, `current_period_end = NOW() + interval '30 days'`.
- **After 30 days:** account drops to Free (20/mo). They can subscribe via existing Razorpay flow at any time before or after expiry. **No cron required for correctness** — the tier check reads `current_period_end` and self-heals.
- **Existing onboarded users (grandfathered):** any doctor with `larinova_doctors.onboarding_completed = true` is exempt from the code gate. Their tier is whatever `larinova_subscriptions` says today.
- **New users:** must redeem a code immediately after first sign-in, before reaching `/onboarding`.
- **Indonesia billing:** removed entirely from the app. `PLAN_PRICES.ID`, the `id` locale redirect on the billing page, and the entire `app/api/xendit/` directory are deleted. Indonesian *landing* (separate codebase) is unchanged.
- **AI feature limits (summary / medical_codes / helena_chat):** while we are in the file, fix the per-lifetime bug — `getUsageCount()` gains a `created_at >= start_of_month_utc()` filter so the 10k cap becomes a real monthly safety rail.
- **Code generation:** SQL inserts only. No admin UI in this iteration.

## 4. Out of scope

- Admin UI to mint codes (future)
- Multi-use / batch codes (future, if open beta needed)
- Razorpay 100%-off promo offer (the comment in `lib/subscription.ts` referencing this is removed; the trial is now a DB-level grant, not a Razorpay coupon)
- Indonesian landing page changes
- Patient portal changes (separate Vercel project, separate scope)
- Any change to the Razorpay paid flow (it already works for IN customers and stays untouched)
- Email/SMS/WhatsApp template overhaul (only the alpha-welcome email is re-keyed)

## 5. Architecture

### 5.1 Database (single new migration)

`supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql`:

```sql
-- 1. Drop "whitelisted" from status enum
ALTER TABLE larinova_subscriptions
  DROP CONSTRAINT IF EXISTS larinova_subscriptions_status_check;
ALTER TABLE larinova_subscriptions
  ADD  CONSTRAINT larinova_subscriptions_status_check
       CHECK (status IN ('active','canceled','past_due','trialing'));

-- (Defensive: any rows currently 'whitelisted' get downgraded to 'active'.
--  Expected count: 0 in production, but safe.)
UPDATE larinova_subscriptions SET status = 'active' WHERE status = 'whitelisted';

-- 2. Invite codes
CREATE TABLE larinova_invite_codes (
  code         TEXT PRIMARY KEY,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at  TIMESTAMPTZ,
  CONSTRAINT redeemed_pair_consistent
    CHECK ((redeemed_by IS NULL) = (redeemed_at IS NULL))
);
CREATE INDEX idx_larinova_invite_codes_redeemed_by
  ON larinova_invite_codes (redeemed_by) WHERE redeemed_by IS NOT NULL;

ALTER TABLE larinova_invite_codes ENABLE ROW LEVEL SECURITY;
-- No user-facing policies. Only service-role reads/writes via RPC.

-- 3. Doctor row gains the gate signal
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS invite_code_redeemed_at TIMESTAMPTZ;

-- 4. Atomic redemption RPC. Uses auth.uid() instead of taking the user
--    id as a parameter — this prevents a logged-in user from redeeming
--    codes on behalf of someone else. Runs as SECURITY DEFINER so it can
--    write to tables RLS would otherwise block, but the identity it acts
--    on is always the caller's auth.uid().
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID := auth.uid();
  v_now            TIMESTAMPTZ := NOW();
  v_period_end     TIMESTAMPTZ := v_now + INTERVAL '30 days';
  v_already        TIMESTAMPTZ;
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

  -- Upsert subscription: 30 days of Pro
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

Notes:
- `redeem_invite_code` is **only** callable from a service-role context — i.e., the API route, never from the browser.
- The `GREATEST(...)` clause is defensive: if a doctor somehow has a future `current_period_end` already (e.g., they bought Razorpay then got an extra invite), we never shorten their access.
- The "already redeemed" branch returns success rather than erroring, which makes the API idempotent — useful if the network drops between RPC call and email send.

### 5.2 Tier resolution change (`lib/subscription.ts`)

Current `checkConsultationLimit`:

```ts
if (plan === "pro" && status === "active") {
  return { allowed: true, used: 0, limit: Infinity, plan };
}
```

Becomes:

```ts
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

Same change in `checkAIUsage`.

`getUsageCount` gains a monthly filter:

```ts
const { count } = await supabase
  .from("larinova_ai_usage")
  .select("*", { count: "exact", head: true })
  .eq("doctor_id", doctorId)
  .eq("feature", feature)
  .gte("created_at", startOfMonthUtcISO(now));   // ← new
```

The stale comment at lines 45–47 referencing "Razorpay 100%-off promo offer" is removed.

### 5.3 Middleware gate (`proxy.ts`)

Insert the check between the existing auth check and the onboarding redirect (around lines 108–142). The doctor lookup already pulls `onboarding_completed`; we extend the select to include `invite_code_redeemed_at`:

```ts
const { data: doctorData, error: doctorError } = await supabase
  .from("larinova_doctors")
  .select("onboarding_completed, locale, invite_code_redeemed_at")
  .eq("user_id", user.id)
  .single();

// ... existing missing-row branch redirects to /onboarding (will trigger
//   the redeem branch below on the next request once the row exists).

// New: invite-code gate, ONLY for users that have not yet onboarded.
if (
  !doctorData.onboarding_completed &&
  !doctorData.invite_code_redeemed_at &&
  !pathname.includes("/redeem")
) {
  redirectUrl.pathname = `/${locale}/redeem`;
  return NextResponse.redirect(redirectUrl);
}
```

Already-onboarded users skip this branch entirely. The existing `!onboarding_completed → /onboarding` redirect runs after the gate, so the resulting flow is:

`sign-in → (callback) → /redeem → /onboarding → /[locale]/`.

### 5.4 Redeem page

Files:
- `app/[locale]/redeem/page.tsx` — server component shell. Reads user from Supabase server client. If the user has already redeemed, redirects to `/[locale]/onboarding`. Renders `<RedeemForm />`.
- `app/[locale]/redeem/RedeemForm.tsx` — client component. Single text input (uppercase, trimmed), submit button, inline error state. Posts to `/api/invite/redeem` and on success navigates to `/[locale]/onboarding`.
- `app/api/invite/redeem/route.ts` — POST. Zod-validates `{ code: string, length 6..40 }`. Reads user via Supabase server client (returns 401 if not authenticated). Calls `supabase.rpc("redeem_invite_code", { p_code: code })` — the RPC reads `auth.uid()` from the JWT, so we never trust a client-supplied user id. On success, fires the alpha-welcome email via Resend. Returns `{ ok: true, period_end }`. On `P0001` `invalid_or_used_code` or `unauthenticated`, returns `400 { error: <code> }`.
- `lib/invite.ts` — small server-side helper exposing `redeemCode(supabase, code)` that wraps the RPC call and the email send. The RPC reads `auth.uid()` from the request JWT, so we don't pass a user id explicitly. Keeps the route handler thin.

UI rules: plain `<Input>` (no search icon), no back button, narrow centered card on a dark hero background per `~/.claude/rules/ui-rules.md`. i18n keys live in `messages/in.json` (and `messages/id.json` for parity even though Indonesia is deferred — keys must exist so `next-intl` doesn't throw).

### 5.5 Email — alpha welcome

`lib/resend/email.ts` already has an alpha-welcome template. It's currently keyed to whitelist activation (which never fires). Re-key it to fire from the invite-redemption path. Body unchanged in spirit: "Welcome to the Larinova alpha. You have 30 days of Pro. Renews from `<period_end>`. Subscribe anytime via your billing page." Sender: `hello@larinova.com`.

### 5.6 Stub & whitelist cleanup

| Path | Action |
|------|--------|
| `app/api/xendit/` (3 routes) | **Delete entire directory** |
| `app/[locale]/(protected)/settings/billing/page.tsx:11–13` | Remove `if (locale === "id") redirect(...)` |
| `app/[locale]/(protected)/settings/billing/BillingClient.tsx` | Remove all `region === "ID"` branches; pricing is IN-only or USD-default |
| `types/billing.ts` `PLAN_PRICES.ID` | Delete the entry |
| `types/billing.ts` `SubscriptionStatus` includes `'whitelisted'` | Remove |
| `lib/subscription.ts:45–47` | Remove whitelist comment |
| `lib/resend/email.ts` alpha-welcome template trigger | Re-key to invite redemption |
| `tests/e2e/billing.spec.ts` whitelist assertions | Replace with invite-redeem tests |
| `components/razorpay-checkout.{tsx,test.ts}` | Verify and strip any whitelist branches |
| `APPLY_MIGRATIONS.sql` | Remove stale entries that reference whitelisted enum |
| Migration `20260423100100_extend_larinova_subscriptions_whitelisted_status.sql` | **Leave in history** — superseded by the new 20260425 migration |

### 5.7 Code generation (manual SQL for now)

```sql
INSERT INTO larinova_invite_codes (code, note) VALUES
  ('LARINOVA-A7K9', 'Pilot doctor 1'),
  ('LARINOVA-B3M2', 'Pilot doctor 2'),
  ('LARINOVA-C9P4', 'Pilot doctor 3'),
  ('LARINOVA-D1X7', 'Pilot doctor 4'),
  ('LARINOVA-E5Q8', 'Pilot doctor 5');
```

Code format is opaque uppercase alphanumerics with one hyphen: `LARINOVA-XXXX`. No charset/length validation beyond the API zod (6..40 chars).

## 6. Data flow

```
sign-in (magic link) → /[locale]/auth/callback
    ↓
proxy.ts looks up larinova_doctors
    ↓
┌─ row missing               → /onboarding (creates row on save)
├─ onboarding_completed=true → fall through (skip code gate)
├─ invite_code_redeemed_at IS NULL AND onboarding_completed=false
│      → /[locale]/redeem
├─ user submits code → POST /api/invite/redeem
│      → supabase.rpc('redeem_invite_code')
│      → atomic: mark code, mark doctor, upsert Pro subscription
│      → Resend: alpha-welcome email
│      → 200 { ok: true, period_end }
│   client redirects → /[locale]/onboarding
└─ invite_code_redeemed_at IS NOT NULL AND onboarding_completed=false
       → /onboarding (existing flow)

T+30 days: current_period_end < NOW() → checkConsultationLimit
   returns Free tier; user can still log in, hits 20/mo cap.
```

## 7. Error handling

| Case | Behavior |
|------|----------|
| Code not found | API 400 `{ error: "invalid_or_used_code" }`; form shows "Invalid or already-used code" |
| Code already redeemed by someone else | Same as above (we don't leak which) |
| User already redeemed a code earlier (idempotent re-call) | RPC returns `{ ok: true, already_redeemed: true }`; client navigates to `/onboarding` |
| RPC throws unexpected error | API 500; Sentry/log; form shows generic "Something went wrong, please try again" |
| Zod validation fails | API 400 `{ error: "invalid_input" }`; form shows "Code looks malformed" |
| Email send fails after RPC succeeded | Log + swallow. RPC is the source of truth — the redemption stands; we don't roll back. |

## 8. Testing

Playwright E2E (new) `tests/e2e/invite-redeem.spec.ts`:
- New user signs in → redirected to `/in/redeem`
- Submits invalid code → sees error, stays on page
- Submits valid code → redirected to `/in/onboarding`; subscription row shows `plan='pro'`, `status='active'`, `current_period_end ≈ now+30d`
- Existing onboarded user sign-in → goes straight to dashboard, never sees `/redeem`
- Already-redeemed user revisits `/in/redeem` directly → bounced to `/in/onboarding` (or dashboard if onboarded)

Playwright E2E (modify) `tests/e2e/billing.spec.ts`:
- Remove the whitelisted-status assertions
- Add: after invite redemption, billing page shows "Pro · expires `<date>`"
- Add: after `current_period_end` is in the past (mock or wait), billing page shows Free tier with usage card

Unit-ish (Bash + curl):
- `POST /api/invite/redeem` happy path
- `POST /api/invite/redeem` invalid code returns 400

The Indonesia billing redirect test, if any, is deleted alongside the route logic.

## 9. Definition of done

- Migration `20260425120000_invite_codes_and_drop_whitelisted.sql` applied to local + production Supabase
- 5 invite codes seeded for pilot doctors
- `/redeem` page and `/api/invite/redeem` route shipped to `app.larinova.com`
- New users blocked from app until they redeem a code
- Existing onboarded users completely unaffected
- `app/api/xendit/` directory removed; `git grep xendit` returns nothing in `app/`
- `git grep -i "whitelist\|whitelisted\|PRO_WHITELIST"` returns nothing in `app/` (excluding migration history)
- `PLAN_PRICES.ID` removed from `types/billing.ts`
- `id` locale redirect removed from billing page
- AI usage limits now reset monthly (UTC)
- Tier check now respects `current_period_end`
- Playwright suite green (existing + new invite-redeem tests)
- Vercel deploy green; smoke-tested as a freshly-invited pilot doctor on the production URL

## 10. Risks & open items

- **Resend deliverability for the welcome email** — same risk as today's transactional email; not a regression.
- **Code leakage** — a pilot doctor could share their code with a friend before redeeming. Acceptable for 5-doctor pilot. If we widen, switch to email-bound codes (`SELECT ... WHERE code=? AND email=?`).
- **`current_period_end` clock skew** — Supabase server time vs Razorpay webhook time. Both are UTC and we trust DB clock. Not a real risk.
- **Race condition: two browsers redeem same code** — `FOR UPDATE` lock in the RPC serializes; loser gets `invalid_or_used_code`. Verified via the test that hits the RPC twice in parallel.
- **Razorpay subscriptions table coexistence** — if a doctor pays via Razorpay later, the existing webhook (`onSubscriptionActivated`) overwrites `current_period_end` to the Razorpay value. That's correct: Razorpay becomes source of truth post-payment.
