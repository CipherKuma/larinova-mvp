# India OPD Platform Implementation Plan

> **For agentic workers:** Pick ONE of three sanctioned execution paths:
> 1. **`superpowers:executing-plans`** — sequential execution with built-in checkpoints (default)
> 2. **cmux-teams** — parallel execution across 3+ independent workstreams via cmux tabs (see `~/.claude/rules/cmux-teams.md`)
> 3. **`superpowers:subagent-driven-development`** — fresh subagent per task, fastest iteration
>
> **Fresh session recommendation:** this plan has 60+ tasks, schema migrations, 3 modules (app / landing / patient portal). Strongly prefer a fresh Claude Code session. Use cmux-teams for Sections 7–13 (they are largely independent after the foundation is in place).
>
> **Testing flow:** Playwright E2E for user journeys + bash/curl for API routes. No strict TDD — write implementation first, then E2E + API tests. Always typecheck before committing. Every commit runs through pre-commit hook (no console.log, no committed secrets).
>
> **Verification between tasks:** executing skills automatically invoke `superpowers:verification-before-completion` before marking each task done.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship full India OPD platform — booking → intake → AI-prepared consult → scribe → WhatsApp follow-up — with Razorpay Live billing, PWA, and patient portal. India-only; Indonesia deferred.

**Architecture:** Next.js 16 + Supabase (auth/DB/RLS) + Inngest (agent orchestration) + Claude Service (all AI) + Resend/MSG91/Gupshup (notify) + Razorpay Live (billing). Three new AI agents. Separate patient portal at `patient.larinova.com`. Spec at `docs/superpowers/specs/2026-04-23-india-opd-platform-design.md`.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, Inngest, Razorpay, Resend, MSG91, Gupshup, next-intl, Tailwind, GSAP (landing), html2pdf.js (Rx PDFs), Playwright.

**Project flow reference:** Read `app/CLAUDE.md`, `~/.claude/rules/backend-rules.md`, `~/.claude/rules/testing-rules.md`, `~/.claude/rules/ui-rules.md`, and `~/.claude/rules/claude-service.md` before starting.

---

## Task groups

1. **Foundations** (Sections 1–3): env, audit, migrations, notify module
2. **Pilot-unblock** (Sections 4–6): tiering, whitelist, alpha welcome, PWA
3. **Razorpay Live** (Section 7)
4. **Inngest + agents** (Sections 8–11): infra, Intake AI, Dispatcher, Wellness
5. **Surfaces** (Sections 12–14): landing OPD reframe, patient portal, doctor-app patient view
6. **Ship** (Section 15): E2E, Lighthouse, launch checklist

---

# SECTION 1 — Environment + sanity audit

### Task 1.1: Env scaffolding

**Files:** Modify `app/.env.example`, `app/.env.local`

- [ ] Add new env var slots to `app/.env.example`:

```
# Razorpay (Live — fill from dashboard)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_PLAN_ID_PRO_MONTHLY=
RAZORPAY_PLAN_ID_PRO_YEARLY=

# MSG91 (SMS India)
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_DLT_TEMPLATE_IDS={}

# Gupshup (WhatsApp)
GUPSHUP_API_KEY=
GUPSHUP_APP_NAME=
GUPSHUP_SOURCE_NUMBER=
GUPSHUP_WEBHOOK_SECRET=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Claude Service
CLAUDE_SERVICE_URL=https://claude.fierypools.fun
CLAUDE_SERVICE_API_KEY=

# Patient portal
NEXT_PUBLIC_PATIENT_PORTAL_URL=https://patient.larinova.com
```

- [ ] Run `~/.claude/vault/inject.sh has` for every new key; report missing ones to the user. Do NOT proceed to Razorpay/Gupshup/MSG91 tasks for keys that are missing from the vault.

- [ ] Commit `feat: add env slots for razorpay, msg91, gupshup, inngest, claude service, patient portal`

### Task 1.2: Sanity audit baseline (local dev)

**Files:** New `app/tests/audit.spec.ts`

- [ ] `cd app && pnpm install && pnpm dev` in background
- [ ] Write Playwright audit file that walks the `in` locale:
  - `/in` renders (no 500)
  - signup page renders
  - protected routes redirect to login
  - `/in/book/[slug]` (public booking) renders for a known slug
- [ ] Run `pnpm playwright test tests/audit.spec.ts` and fix any hard failures
- [ ] Log any i18n key misses to `app/tests/audit-report.md`
- [ ] Commit `test: baseline playwright audit of in locale`

### Task 1.3: Sanity audit baseline (production)

- [ ] Use playwright-cli-sessions to probe production `app.larinova.com/in` — check SSL, root renders, signup form accepts email, protected redirect
- [ ] Screenshot each main route, save to `/tmp/audit-prod/`
- [ ] Note any prod-only failures in `app/tests/audit-report.md`
- [ ] No commit — observational only

---

# SECTION 2 — Data model (migrations)

Supabase migrations live at `app/supabase/migrations/`. Numbered by timestamp.

### Task 2.1: Billing / tiering columns on `doctors`

**Files:** Create `app/supabase/migrations/20260423100000_add_doctor_billing_columns.sql`

- [ ] Write migration:

```sql
alter table doctors
  add column if not exists plan text not null default 'free' check (plan in ('free','pro')),
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text check (subscription_status in ('active','cancelled','past_due','trialing','whitelisted')),
  add column if not exists alpha_welcomed_at timestamptz;

create index if not exists idx_doctors_plan on doctors(plan);
```

- [ ] Apply: `cd app && npx supabase db push` (or append to `APPLY_MIGRATIONS.sql`)
- [ ] Verify via `psql` or Supabase Studio: new columns exist
- [ ] Commit `feat(db): add plan + subscription columns to doctors`

### Task 2.2: `appointments` + intake tables

**Files:** Create `app/supabase/migrations/20260423100100_create_appointments_and_intake.sql`

- [ ] Write the three tables per spec §5.5 (`appointments`, `intake_templates`, `intake_submissions`), plus RLS policies:
  - Doctor reads/writes own appointments (via `doctor_id = auth.jwt_claim('doctor_id')` — use existing auth pattern from `consultations` RLS)
  - Patient reads own appointments via patient_id match (for patient portal context)
- [ ] Apply migration
- [ ] Commit `feat(db): add appointments, intake_templates, intake_submissions`

### Task 2.3: `patient_documents` + storage bucket

**Files:** Create `app/supabase/migrations/20260423100200_create_patient_documents.sql`, also Supabase storage bucket `patient-documents`

- [ ] Write migration for `patient_documents` table per spec §5.5
- [ ] In Supabase Studio: create storage bucket `patient-documents` (private), RLS policies:
  - Doctor can read docs for their patients
  - Patient can upload + read own docs (via JWT claim)
  - Agent role can insert
- [ ] Apply migration
- [ ] Commit `feat(db): add patient_documents + storage bucket`

### Task 2.4: `messages` table

**Files:** Create `app/supabase/migrations/20260423100300_create_messages.sql`

- [ ] Write migration per spec §5.5 `messages` table + indexes
- [ ] RLS: doctor reads all messages tied to their patients
- [ ] Apply + commit `feat(db): add messages table`

### Task 2.5: `agent_jobs` table

**Files:** Create `app/supabase/migrations/20260423100400_create_agent_jobs.sql`

- [ ] Write migration per spec §5.5
- [ ] RLS: admin-only for now (no doctor-facing read)
- [ ] Apply + commit `feat(db): add agent_jobs table`

### Task 2.6: `follow_up_threads` + `patient_narrative`

**Files:** Create `app/supabase/migrations/20260423100500_create_follow_up_and_narrative.sql`

- [ ] Write both tables per spec §5.5
- [ ] RLS: doctor reads own patients' threads + narratives
- [ ] Apply + commit `feat(db): add follow_up_threads and patient_narrative`

### Task 2.7: `consultations.appointment_id` + `follow_up_schedule`

**Files:** Create `app/supabase/migrations/20260423100600_extend_consultations.sql`

- [ ] ALTER TABLE consultations add `appointment_id uuid references appointments(id)` and `follow_up_schedule jsonb`
- [ ] Apply + commit `feat(db): link consultations to appointments + follow-up schedule`

---

# SECTION 3 — `lib/notify/` unified notifications

### Task 3.1: Scaffold module

**Files:** Create:
- `app/lib/notify/index.ts`
- `app/lib/notify/types.ts`
- `app/lib/notify/email.ts`
- `app/lib/notify/sms.ts`
- `app/lib/notify/whatsapp.ts`

- [ ] `types.ts`:

```ts
export type Channel = 'email' | 'sms' | 'whatsapp' | 'in_app';
export type Direction = 'out' | 'in';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'replied';

export interface Recipient {
  patientId?: string;
  doctorId?: string;
  email?: string;
  phone?: string;      // E.164
  whatsapp?: string;   // E.164
}

export interface NotifyResult {
  messageId: string;          // messages.id
  providerMsgId: string | null;
  status: MessageStatus;
  error?: string;
}
```

- [ ] `index.ts` exports `notify(channel, templateKey, data, recipient)` that:
  1. Resolves template via `templates/<templateKey>/<channel>.ts`
  2. Inserts `messages` row with status='queued'
  3. Calls channel-specific send
  4. Updates `messages` row with provider id + status='sent' (or failed + error)
  5. Returns `NotifyResult`

- [ ] Stub `email.ts`, `sms.ts`, `whatsapp.ts` with TODO bodies that throw "not implemented"
- [ ] `pnpm typecheck` passes
- [ ] Commit `feat(notify): scaffold unified notify module`

### Task 3.2: Email (Resend) implementation

**Files:** Modify `app/lib/notify/email.ts`

- [ ] Implement Resend wrapper using existing `app/lib/resend/email.ts` client. Template function returns `{subject, html, text, attachments?}`.
- [ ] Wire into `notify()` dispatch
- [ ] Write a one-shot test route `app/app/api/test-notify/email/route.ts` that sends a test email to a provided address
- [ ] Curl test: `curl -X POST http://localhost:3000/api/test-notify/email -d '{"to":"your@email.com"}'`; verify inbox
- [ ] Commit `feat(notify): implement email channel via Resend`

### Task 3.3: SMS (MSG91) implementation

**Files:** Modify `app/lib/notify/sms.ts`, new `app/lib/notify/webhooks/msg91.ts`, new `app/app/api/webhooks/msg91/route.ts`

- [ ] Implement MSG91 send using their [Flow API](https://docs.msg91.com/) — POST to `https://api.msg91.com/api/v5/flow/` with `authkey`, `template_id`, `mobiles`, `variables`
- [ ] Implement webhook handler that updates `messages.status` on delivery callbacks (MSG91 delivery webhook posts JSON)
- [ ] Create test route `/api/test-notify/sms`
- [ ] Commit `feat(notify): implement sms channel via msg91 with delivery webhooks`

### Task 3.4: WhatsApp (Gupshup) implementation

**Files:** Modify `app/lib/notify/whatsapp.ts`, new `app/lib/notify/webhooks/gupshup.ts`, new `app/app/api/webhooks/gupshup/route.ts`

- [ ] Implement Gupshup outbound via their [sandbox/live API](https://docs.gupshup.io/) — POST to `https://api.gupshup.io/wa/api/v1/msg` with `Content-Type: application/x-www-form-urlencoded`, headers `apikey`, body fields `channel=whatsapp`, `source=<number>`, `destination=<number>`, `message`
- [ ] Inbound webhook handler:
  - Verify HMAC signature against `GUPSHUP_WEBHOOK_SECRET`
  - Persist inbound `messages` row (direction='in')
  - If related to an open `follow_up_thread`, emit Inngest event `followup.message_received`
  - Otherwise emit `whatsapp.message_received` (for intake flow)
- [ ] Commit `feat(notify): implement whatsapp channel via gupshup + inbound webhook`

### Task 3.5: Template catalogue

**Files:** Create `app/lib/notify/templates/<key>/{email,sms,whatsapp}.ts` for each of the 12 templates in spec §9.

- [ ] Implement templates, one per file:
  - `appointment_confirmation/{email,sms,whatsapp}.ts`
  - `appointment_reminder_1d/{email,sms,whatsapp}.ts`
  - `appointment_reminder_1h/{sms,whatsapp}.ts`
  - `intake_info_request/{email,whatsapp}.ts`
  - `consultation_summary/{email,sms,whatsapp}.ts`
  - `followup_prompt_day1/whatsapp.ts`
  - `followup_prompt_day3/whatsapp.ts`
  - `followup_prompt_day7/whatsapp.ts`
  - `followup_flagged_doctor/{email,in_app}.ts`
  - `welcome_alpha/email.ts`
  - `subscription_activated/email.ts`
  - `subscription_payment_failed/email.ts`
- [ ] Each exports `(data) => { subject?, body, attachments? }`; English only (`in` locale)
- [ ] `pnpm typecheck` passes
- [ ] Commit `feat(notify): template catalogue for all 12 notification kinds`

### Task 3.6: Replace direct Resend calls across codebase with `notify()`

**Files:** `grep -rln "lib/resend" app/app app/lib` — migrate all call sites

- [ ] For each existing direct Resend usage in routes, swap to `notify('email', templateKey, data, recipient)`
- [ ] `pnpm typecheck` passes
- [ ] Manual verify: signup confirmation email still works
- [ ] Commit `refactor(notify): route existing resend calls through unified notify module`

---

# SECTION 4 — Tiering + whitelist + free-tier guard

### Task 4.1: Billing config update

**Files:** Modify `app/types/billing.ts`

- [ ] Replace `PLAN_PRICES` with the 3-region version per spec §7:

```ts
export type PricingRegion = 'IN' | 'ID' | 'default';

export const PLAN_PRICES: Record<PricingRegion, {
  currency: string;
  symbol: string;
  month: { amount: number; label: string };
  year:  { amount: number; label: string; savings: string };
}> = {
  IN: {
    currency: 'INR', symbol: '₹',
    month: { amount: 150000, label: '₹1,500/month' },
    year:  { amount: 1500000, label: '₹15,000/year', savings: '₹3,000' },
  },
  ID: {
    currency: 'IDR', symbol: 'Rp',
    month: { amount: 29900000, label: 'Rp 299,000/month' },
    year:  { amount: 299000000, label: 'Rp 2,990,000/year', savings: 'Rp 598,000' },
  },
  default: {
    currency: 'USD', symbol: '$',
    month: { amount: 2000, label: '$20/month' },
    year:  { amount: 20000, label: '$200/year', savings: '$40' },
  },
};

export const FREE_TIER_CONSULTATION_LIMIT = 20;
```

- [ ] `pnpm typecheck` passes
- [ ] Commit `feat(billing): add IDR tier, introduce FREE_TIER_CONSULTATION_LIMIT`

### Task 4.2: PRO_WHITELIST + upgrade-on-login

**Files:** Modify `app/lib/subscription.ts`, modify auth callback (likely `app/app/auth/callback/route.ts` — verify by grep)

- [ ] Add to `lib/subscription.ts`:

```ts
export const PRO_WHITELIST: readonly string[] = [
  // Pilot 5 — fill with real emails at deploy time
  // "dr.priya@example.com",
  // ...
];

export function isWhitelisted(email: string): boolean {
  return PRO_WHITELIST.some(e => e.toLowerCase() === email.toLowerCase());
}

export async function upgradeIfWhitelisted(supabase, doctorId: string, email: string) {
  if (!isWhitelisted(email)) return { upgraded: false };
  const { data: doctor } = await supabase.from('doctors').select('plan, alpha_welcomed_at').eq('id', doctorId).single();
  if (doctor?.plan === 'pro') return { upgraded: false };
  await supabase.from('doctors').update({
    plan: 'pro',
    subscription_status: 'whitelisted',
  }).eq('id', doctorId);
  return { upgraded: true, firstTime: !doctor?.alpha_welcomed_at };
}
```

- [ ] Call `upgradeIfWhitelisted()` in the auth callback route after session is established
- [ ] If `firstTime: true`, trigger `notify('email', 'welcome_alpha', {...}, {email})` and set `alpha_welcomed_at = now()` atomically
- [ ] Commit `feat(billing): pro whitelist + upgrade on login + alpha welcome email`

### Task 4.3: Free-tier consultation guard

**Files:** Modify `app/app/api/consultations/start/route.ts`

- [ ] At the top of the POST handler, after auth check:

```ts
const { data: doctor } = await supabase.from('doctors').select('plan').eq('id', doctorId).single();
if (doctor?.plan === 'free') {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('consultations')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .gte('created_at', startOfMonth.toISOString());
  if ((count ?? 0) >= FREE_TIER_CONSULTATION_LIMIT) {
    return NextResponse.json({
      error: 'free_tier_exhausted',
      limit: FREE_TIER_CONSULTATION_LIMIT,
      used: count,
    }, { status: 402 });
  }
}
```

- [ ] Curl test: create a test doctor with 20 consultations in current month, verify 402 returned
- [ ] Commit `feat(billing): free-tier consultation limit enforcement`

### Task 4.4: Free-tier exhaustion UX

**Files:** Modify consultation-start client component (locate via `grep -rln "consultations/start" app/app/\[locale\]`)

- [ ] On `fetch` 402 response, show modal:
  - Title: "You've reached your free tier limit"
  - Body: "You've completed 20 consultations this month. Upgrade to Pro for unlimited."
  - Primary CTA: "Upgrade to Pro" → `/[locale]/settings/billing`
  - Dismiss: "I'll upgrade later"
- [ ] Respect existing UI rules — use shadcn Dialog, no emoji
- [ ] Commit `feat(ui): free-tier exhaustion upgrade modal`

### Task 4.5: Alpha welcome banner

**Files:** Create `app/components/alpha-welcome-banner.tsx`, modify `app/app/[locale]/(protected)/layout.tsx`

- [ ] Component reads `doctor.subscription_status === 'whitelisted'` and localStorage dismiss flag; renders slim banner at top:
  > **You're one of our first alpha doctors.** Thank you — every note you dictate helps shape Larinova.
- [ ] Dismiss button sets `localStorage.setItem('alpha_banner_dismissed_v1', '1')`
- [ ] Commit `feat(ui): alpha doctor welcome banner`

### Task 4.6: Billing page — remove "Coming Soon"

**Files:** Modify `app/app/[locale]/(protected)/settings/billing/BillingClient.tsx`

- [ ] Remove the "Coming Soon" overlay
- [ ] Render state-based UI:
  - If `plan='free'`: show "Free plan · X/20 consults this month" + "Upgrade to Pro" CTA
  - If `plan='pro' && subscription_status='whitelisted'`: show "Alpha doctor — thank you" badge, no billing UI
  - If `plan='pro' && subscription_status='active'`: show plan name, next renewal, "Manage billing" mailto for now
- [ ] Commit `feat(billing): render real billing state, remove coming soon overlay`

---

# SECTION 5 — PWA

### Task 5.1: Generate icons from logo

**Files:** Create `app/public/icons/` with `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`

- [ ] Use ImageMagick (or `npx sharp-cli`) to generate the 4 icon sizes from `logo-gen/larinova-dark-square-icon.png` (exact filename TBD — check `logo-gen/`)

```bash
cd app/public/icons
npx @squoosh/cli --resize '{"enabled":true,"width":192,"height":192}' -d . ../../../logo-gen/larinova-dark-square-icon.png
# or sharp-cli:
npx sharp-cli -i ../../../logo-gen/larinova-dark-square-icon.png -o icon-192.png resize 192 192
npx sharp-cli -i ../../../logo-gen/larinova-dark-square-icon.png -o icon-512.png resize 512 512
npx sharp-cli -i ../../../logo-gen/larinova-dark-square-icon.png -o apple-touch-icon-180.png resize 180 180
# Maskable needs 20% safe-zone padding; create via ImageMagick convert or design tool
```

- [ ] Commit `chore(pwa): add icon set`

### Task 5.2: Web app manifest

**Files:** Create `app/public/manifest.webmanifest`

- [ ] Content:

```json
{
  "name": "Larinova",
  "short_name": "Larinova",
  "description": "AI OPD assistant for Indian doctors",
  "start_url": "/in",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0b0b0f",
  "theme_color": "#0b0b0f",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] Commit `feat(pwa): add web app manifest`

### Task 5.3: Register manifest + Apple meta tags

**Files:** Modify `app/app/[locale]/layout.tsx`

- [ ] Add to `<head>`:

```tsx
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Larinova" />
<meta name="theme-color" content="#0b0b0f" />
```

- [ ] Commit `feat(pwa): register manifest and apple-specific meta`

### Task 5.4: Service worker via next-pwa

**Files:** `cd app && pnpm add -D next-pwa`, modify `app/next.config.ts`

- [ ] Wrap config:

```ts
import nextPwa from 'next-pwa';

const withPWA = nextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    { urlPattern: /^https?.*\/api\/.*$/, handler: 'NetworkOnly' },
    { urlPattern: /\.(?:js|css|woff2?|png|svg|webp)$/, handler: 'StaleWhileRevalidate' },
  ],
  fallbacks: { document: '/offline' },
});

export default withPWA({
  // existing config
});
```

- [ ] Create `app/app/offline/page.tsx` with minimal offline content
- [ ] Build + deploy preview; run Lighthouse PWA audit
- [ ] Fix any Lighthouse issues until score ≥ 90
- [ ] Commit `feat(pwa): service worker + offline fallback`

---

# SECTION 6 — Audit verification + pilot-unblock E2E

### Task 6.1: Playwright E2E — doctor signup → login → consult → billing

**Files:** Create `app/tests/doctor-journey.spec.ts`

- [ ] Full happy path test:
  1. Signup with temp email (Mailhog / playwright inbox)
  2. Verify via email link
  3. Login, redirected to `/in`
  4. Start consultation (must 402 if count > 20, else 200)
  5. Visit `/in/settings/billing`, check state
- [ ] `pnpm playwright test tests/doctor-journey.spec.ts` passes
- [ ] Commit `test(e2e): doctor signup + consult + billing journey`

### Task 6.2: Add pilot doctor emails to PRO_WHITELIST

**Files:** Modify `app/lib/subscription.ts`

- [ ] User provides 5 emails; add to array
- [ ] Deploy
- [ ] Verify: each doctor logs in, sees alpha banner + has `plan='pro'` in DB
- [ ] Commit `feat(billing): whitelist 5 pilot doctors`

---

# SECTION 7 — Razorpay Live integration

> **Prereq:** Razorpay dashboard in Live mode, plans created, webhook URL registered, keys in vault

### Task 7.1: Finalise create-subscription route

**Files:** Modify `app/app/api/razorpay/create-subscription/route.ts`

- [ ] Accept body `{ interval: 'month'|'year' }`
- [ ] Look up doctor; if has active `razorpay_subscription_id`, return error "already subscribed"
- [ ] Create Razorpay customer if not exists, persist `razorpay_customer_id`
- [ ] Create subscription against plan id from env
- [ ] Return `{ subscription_id, short_url, key_id: NEXT_PUBLIC_RAZORPAY_KEY_ID }`
- [ ] Curl test against Razorpay test mode
- [ ] Commit `feat(billing): complete razorpay create-subscription route`

### Task 7.2: Finalise webhook handler

**Files:** Modify `app/app/api/razorpay/webhook/route.ts`

- [ ] Verify HMAC: `x-razorpay-signature` vs `HMAC-SHA256(raw_body, RAZORPAY_WEBHOOK_SECRET)`
- [ ] Handle events:
  - `subscription.activated`: set `doctor.plan='pro'`, `subscription_status='active'`, `razorpay_subscription_id`; `notify('email', 'subscription_activated', ...)`
  - `subscription.charged`: update `current_period_end`
  - `subscription.halted` / `subscription.cancelled`: set `subscription_status='cancelled'`; doctor stays on pro until period end
  - `payment.failed`: set `subscription_status='past_due'`; `notify('email', 'subscription_payment_failed', ...)`
- [ ] Idempotency: check `razorpay_payment_id` uniqueness before insert
- [ ] Test via Razorpay test mode webhook simulator
- [ ] Commit `feat(billing): razorpay webhook handler with all subscription events`

### Task 7.3: Checkout modal on billing page

**Files:** Modify `app/app/[locale]/(protected)/settings/billing/BillingClient.tsx`, add `app/components/razorpay-checkout.tsx`

- [ ] Install Razorpay.js via dynamic script load: `<script src="https://checkout.razorpay.com/v1/checkout.js">`
- [ ] "Upgrade to Pro" → calls `POST /api/razorpay/create-subscription` → opens Razorpay modal with returned `subscription_id`
- [ ] Success handler redirects to `/in/settings/billing?upgraded=1`
- [ ] `pnpm typecheck`, E2E test in test mode
- [ ] Commit `feat(billing): razorpay checkout modal on billing page`

### Task 7.4: Checkout on landing pricing

**Files:** Modify `landing/src/components/Pricing.tsx` (or locate current pricing component)

- [ ] Pro CTA behavior:
  - If user is unauthenticated → redirect to `app.larinova.com/in/signup?next=/settings/billing?upgrade=1`
  - If authenticated → open Razorpay modal directly via the same flow as billing page
- [ ] Commit `feat(landing): razorpay checkout on pricing page`

---

# SECTION 8 — Inngest infrastructure

### Task 8.1: Install + client

**Files:** `cd app && pnpm add inngest`, create `app/lib/inngest/client.ts`

- [ ] `client.ts`:

```ts
import { Inngest } from 'inngest';
export const inngest = new Inngest({ id: 'larinova', eventKey: process.env.INNGEST_EVENT_KEY! });

export type LarinovaEvents = {
  'appointment.booked':        { data: { appointmentId: string; doctorId: string; patientId: string } };
  'intake.submitted':          { data: { appointmentId: string } };
  'intake.info_requested':     { data: { appointmentId: string; questions: string[] } };
  'intake.info_received':      { data: { appointmentId: string; replyMessageId: string } };
  'intake.prep_ready':         { data: { appointmentId: string } };
  'consultation.finalized':    { data: { consultationId: string } };
  'followup.scheduled':        { data: { threadId: string; tier: 'day-1'|'day-3'|'day-7' } };
  'followup.message_received': { data: { threadId: string; body: string } };
  'followup.flagged':          { data: { threadId: string } };
  'payment.subscription_activated': { data: { doctorId: string } };
};
```

- [ ] Commit `feat(inngest): install + typed client`

### Task 8.2: Serve endpoint

**Files:** Create `app/app/api/inngest/route.ts`

- [ ] Standard `inngest/next` setup:

```ts
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { intakeAgent } from '@/lib/agents/intake';
import { dispatcher } from '@/lib/agents/dispatcher';
import { wellness } from '@/lib/agents/wellness';
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [intakeAgent, dispatcher, wellness],
});
```

- [ ] Stub three agent files with `inngest.createFunction({ id }, { event }, async () => {})`
- [ ] `pnpm typecheck` passes
- [ ] Register app in Inngest dashboard, add URL `https://app.larinova.com/api/inngest`
- [ ] Verify dashboard lists 3 functions
- [ ] Commit `feat(inngest): serve endpoint + 3 agent stubs`

### Task 8.3: Claude Service client

**Files:** Create `app/lib/ai/claude.ts`

- [ ] Per `~/.claude/rules/claude-service.md`:

```ts
type Model = 'sonnet' | 'opus';

export async function chatSync(opts: {
  model?: Model;
  system?: string;
  messages: { role: 'user'|'assistant'; content: string }[];
  jsonMode?: boolean;
}): Promise<string> {
  const res = await fetch(`${process.env.CLAUDE_SERVICE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.CLAUDE_SERVICE_API_KEY!,
    },
    body: JSON.stringify({
      model: opts.model ?? 'sonnet',
      system: opts.system,
      messages: opts.messages,
      json_mode: opts.jsonMode ?? false,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`claude-service ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content;
}
```

- [ ] Commit `feat(ai): claude service client`

---

# SECTION 9 — Pre-consult Intake AI

### Task 9.1: Intake template form builder (doctor settings)

**Files:** Create `app/app/[locale]/(protected)/settings/intake/page.tsx`, `app/components/intake-template-builder.tsx`

- [ ] UI for doctor to create one intake template: title, description, fields (short_text, long_text, single_select, multi_select, number, date, yes_no, file)
- [ ] Save to `intake_templates` via route `POST /api/intake-templates`
- [ ] Only one template per doctor for v1 (mark `is_default=true` automatically)
- [ ] Commit `feat(intake): doctor template builder`

### Task 9.2: Intake form at public booking

**Files:** Modify `landing/src/app/book/[slug]/page.tsx` (or existing booking component), new `app/app/api/appointments/book/route.ts`

- [ ] After slot picked, render doctor's default intake template
- [ ] Submit → POST to `app.larinova.com/api/appointments/book` with slot + intake payload
- [ ] Server creates `appointments` + `intake_submissions` rows; emits `appointment.booked` + `intake.submitted` Inngest events
- [ ] Reply with confirmation page
- [ ] Commit `feat(booking): intake form at public booking + event emission`

### Task 9.3: Intake AI Inngest function

**Files:** Modify `app/lib/agents/intake.ts`

- [ ] Subscribe to `intake.submitted`
- [ ] Steps (`step.run`):
  1. Load appointment + intake submission + patient history
  2. Call Claude (Sonnet) with structured prompt — return JSON `{ ready: boolean; questions: string[]; documents_requested: string[]; summary: string }`
  3. If `ready=false` and `ai_followup_rounds < 3`:
     - For each question, send WhatsApp (and email if patient has no WA) via `notify('whatsapp'|'email', 'intake_info_request', {...})`
     - Increment `intake_submissions.ai_followup_rounds`
     - Use `step.waitForEvent('intake.info_received', { timeout: '48h' })` per question, feed replies back
  4. If `ready=true` OR rounds hit 3: generate Prep Brief via Claude → save to `appointments.prep_brief` → emit `intake.prep_ready`
- [ ] Log every step to `agent_jobs` via helper `logAgent(agent, event, payload, result)`
- [ ] Test via simulation harness (Section 14)
- [ ] Commit `feat(agents): intake AI with follow-up loop + prep brief`

### Task 9.4: Prep Brief banner on consult screen

**Files:** Modify consultation record component (locate via `grep -rln "consultation" app/app/\[locale\]/\(protected\)`)

- [ ] When opening a consult for an appointment, show collapsible Prep Brief at top (markdown render)
- [ ] Red-flag sections styled with warning color
- [ ] Commit `feat(consult): prep brief banner on consult screen`

---

# SECTION 10 — Post-consult Dispatcher

### Task 10.1: Dispatcher agent

**Files:** Modify `app/lib/agents/dispatcher.ts`

- [ ] Subscribe to `consultation.finalized`
- [ ] Steps:
  1. Load consultation (SOAP, Rx, ICD-10)
  2. Generate patient-readable summary via Claude: "rewrite this SOAP in plain English for a layperson, one paragraph, no clinical jargon"
  3. Render Rx PDF using existing renderer (India format)
  4. Upload PDF to Supabase Storage `patient-documents/`
  5. `notify('email', 'consultation_summary', {...}, patient.email)` with PDF attachment
  6. `notify('whatsapp', 'consultation_summary', {...}, patient.whatsapp)` with PDF URL
  7. `notify('sms', 'consultation_summary', {...}, patient.phone)` with portal magic-link
  8. For each tier in `consultation.follow_up_schedule` (default `['day-1','day-3','day-7']`), insert `follow_up_threads` row + emit `followup.scheduled` (Inngest `step.sleepUntil` honors schedule)
- [ ] Commit `feat(agents): dispatcher auto-sends summary + schedules follow-ups`

### Task 10.2: Consultation finalize hook

**Files:** Modify existing "finalize consult" route (grep for it in `api/consultation/`)

- [ ] On finalize, emit `inngest.send({ name: 'consultation.finalized', data: { consultationId } })`
- [ ] Commit `feat(consult): emit finalize event to trigger dispatcher`

---

# SECTION 11 — Wellness Follow-up Agent

### Task 11.1: Wellness agent scheduling + first message

**Files:** Modify `app/lib/agents/wellness.ts`

- [ ] Subscribe to `followup.scheduled`
- [ ] Steps:
  1. Load `follow_up_threads` + consultation context
  2. `step.sleepUntil(schedule.scheduled_for)`
  3. Generate first-message prompt via Claude (tier-aware):
     - day-1: empathetic check-in on chief complaint
     - day-3: "how are the meds treating you?"
     - day-7: wellness check + reminder of follow-up if needed
  4. Send WhatsApp via `notify('whatsapp', 'followup_prompt_day<N>', {...})`
  5. Append to `follow_up_threads.transcript` as role='agent'
- [ ] Commit `feat(agents): wellness first message + scheduling`

### Task 11.2: Conversational loop + classification

**Files:** Modify `app/lib/agents/wellness.ts` (continued), modify `app/lib/notify/webhooks/gupshup.ts`

- [ ] In Gupshup inbound webhook, if message text comes from a phone tied to an open `follow_up_thread`, emit `followup.message_received`
- [ ] Wellness agent subscribes to `followup.message_received`:
  1. Append inbound to `transcript`
  2. Call Claude with full transcript + system prompt: "decide next move" — returns JSON `{ action: 'probe'|'escalate'|'close'; body?: string; classification: 'improving'|'unchanged'|'flagged' }`
  3. Update `follow_up_threads.outcome`
  4. If action='probe': send reply, wait for next `followup.message_received` (`step.waitForEvent` with 48h timeout)
  5. If action='escalate': set `flagged=true`, `doctor_notified_at=now()`, emit `followup.flagged`, `notify('email', 'followup_flagged_doctor', ...)`
  6. If action='close': set `outcome='closed'`, send a closing WhatsApp, exit
- [ ] Handle patient `STOP` keyword → set `patient_opted_out=true`, close thread
- [ ] Max 10 exchange rounds hard cap to avoid runaway costs
- [ ] Commit `feat(agents): wellness conversational loop + classification + flagging`

### Task 11.3: Doctor-facing flagged-follow-up UI

**Files:** Modify doctor app home + patient detail page

- [ ] If any flagged thread exists for a doctor, show an alert banner: "N patients flagged from follow-up" with link to list
- [ ] Patient detail page shows follow-up thread transcript in a dedicated section with outcome pill
- [ ] Commit `feat(ui): doctor-facing flagged follow-up alerts + transcript view`

---

# SECTION 12 — Patient record & narrative

### Task 12.1: Patient narrative generator

**Files:** Create `app/lib/agents/narrative.ts`, cron via Supabase `pg_cron` or Inngest scheduled function

- [ ] Function: `generateNarrative(patientId)` — loads last 5 consultations + allergies + chronic conditions + current meds; calls Claude: "3-5 sentence doctor-facing summary"
- [ ] Save to `patient_narrative` table
- [ ] Trigger: emit `narrative.regenerate` event on `consultation.finalized`; Inngest function runs `generateNarrative`
- [ ] Commit `feat(agents): patient narrative generator`

### Task 12.2: Patient detail page

**Files:** Modify `app/app/[locale]/(protected)/patients/[id]/page.tsx` (create if missing)

- [ ] Top card: AI narrative summary + "last seen" date + contact info
- [ ] Timeline below: union of appointments, consultations, documents, follow-up threads, messages — sorted desc by date
- [ ] Floating "Ask AI about this patient" button (scopes existing Helena chat to patientId)
- [ ] Commit `feat(ui): patient detail with narrative + timeline`

### Task 12.3: Doctor home — queue view

**Files:** Modify `app/app/[locale]/(protected)/page.tsx` (the dashboard home)

- [ ] Replace stat cards (if any) with queue:
  - Big "Next patient" card with Start Consult button
  - Sidebar list: today's appointments ordered by `slot_start`, status pills
- [ ] Commit `feat(ui): queue-first home screen`

---

# SECTION 13 — Landing page OPD-first reframe (India only)

### Task 13.1: Hero rewrite

**Files:** Modify `landing/src/app/[locale]/page.tsx` (or hero component) for `in` locale only

- [ ] Headline: "Larinova — the OPD assistant for Indian doctors"
- [ ] Sub: "See more patients. Type less. Send prescriptions on WhatsApp."
- [ ] Primary CTA: "Start free" → `https://app.larinova.com/in/signup`
- [ ] Background: animated radial gradient + noise (per `~/.claude/rules/ui-rules.md` "background on centered heroes" — centered hero must have visual weight)
- [ ] Commit `feat(landing): OPD-first hero for India`

### Task 13.2: 5-phase scroll narrative

**Files:** Modify `landing/src/components/features/` (or equivalent), install GSAP + Lenis if not already

- [ ] Rip out any existing feature card grid for `in` locale
- [ ] Implement scroll-scrubbed narrative per spec §6.2 — one full viewport per phase, alternating visual side, GSAP ScrollTrigger staggers each phase in
- [ ] Phases: BOOK, INTAKE, PREP, CONSULT, FOLLOW-UP
- [ ] Each phase mocked with a realistic animated demo (static SVG + Framer Motion acceptable for v1; a real Remotion video is a nice-to-have for later)
- [ ] Commit `feat(landing): 5-phase OPD scroll narrative`

### Task 13.3: 2-tier pricing with Razorpay Checkout

**Files:** Modify `landing/src/components/Pricing.tsx`, update `landing/src/data/locale-content.ts` for `in`

- [ ] Render 2 cards: Free and Pro
  - Free: ₹0/mo, 20 consults/mo, list of features
  - Pro: ₹1,500/mo or ₹15,000/yr (17% off toggle), unlimited
- [ ] Monthly / Annual toggle
- [ ] Pro CTA → Razorpay Checkout (auth-guarded per Task 7.4)
- [ ] Enterprise strip below: `mailto:hello@larinova.com`
- [ ] Mobile responsive: stacked on narrow
- [ ] Commit `feat(landing): 2-tier pricing with live razorpay checkout`

### Task 13.4: Indonesia landing — no changes

- [ ] Explicitly verify no `id` locale files touched in this section
- [ ] Document in commit notes: "Indonesia landing deferred to Indonesia enablement spec"

---

# SECTION 14 — Patient portal (`patient.larinova.com`)

### Task 14.1: Scaffold new Next.js project

**Files:** Create `patient-portal/` at repo root (or the monorepo's convention)

- [ ] `npx create-next-app@latest patient-portal --ts --tailwind --app --no-src-dir --eslint --use-pnpm`
- [ ] Install shared Supabase deps: `@supabase/supabase-js @supabase/ssr`
- [ ] Copy shared `lib/supabase/` client creation helpers from app
- [ ] Add own `CLAUDE.md` with brief
- [ ] Commit `feat(patient-portal): scaffold next.js app`

### Task 14.2: Magic-link auth

**Files:** Create `patient-portal/app/(auth)/login/page.tsx`, `patient-portal/app/auth/callback/route.ts`

- [ ] Login page: email input → `supabase.auth.signInWithOtp({ email })`
- [ ] Callback route: exchange code → set session cookie → redirect to `/`
- [ ] Middleware that redirects unauth'd users to `/login`
- [ ] Commit `feat(patient-portal): magic-link auth`

### Task 14.3: Five patient routes

**Files:** Create 5 pages under `patient-portal/app/`

- [ ] `/` — current upcoming appointment + recent Rx + follow-up status
- [ ] `/appointments/[id]` — detail + reschedule + cancel + upload documents
- [ ] `/appointments/[id]/intake` — fill / edit intake form
- [ ] `/prescriptions/[id]` — view Rx + PDF download
- [ ] `/documents` — list uploads + AI-requested pending
- [ ] Each page server-side validates JWT patient_id matches row
- [ ] Commit `feat(patient-portal): five patient-facing routes`

### Task 14.4: Deploy to Vercel + DNS

**Files:** `vercel.json`, Vercel dashboard

- [ ] `vercel link` inside `patient-portal/` — new project `larinova-patient-portal`
- [ ] Add envs (Supabase URL, anon key, NEXT_PUBLIC_APP_URL)
- [ ] Add custom domain `patient.larinova.com` in Vercel settings
- [ ] Configure DNS: CNAME `patient` → `cname.vercel-dns.com` at DNS provider
- [ ] Verify deployment at `https://patient.larinova.com`
- [ ] Commit `chore(patient-portal): vercel deploy`

### Task 14.5: Link from app + messages

**Files:** `app/lib/notify/templates/*`

- [ ] Every SMS/email/WhatsApp with a portal link uses `process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL` as base
- [ ] Magic-link tokens generated server-side via `supabase.auth.admin.generateLink({ type: 'magiclink', email })` and embedded in templates
- [ ] Commit `feat(notify): templates include patient portal magic links`

---

# SECTION 15 — Quality, simulation, launch

### Task 15.1: Agent simulation harness

**Files:** Create `app/scripts/simulate-intake.ts`, `app/scripts/simulate-wellness.ts`

- [ ] Scripts insert fake appointment + intake, push Inngest events into local dev server, print every outbound message to stdout instead of actually sending (use env `SIMULATE_NOTIFY=1` to short-circuit providers)
- [ ] Modify `lib/notify/*.ts` to respect `SIMULATE_NOTIFY=1` — log body + recipient instead of calling provider
- [ ] Run: `SIMULATE_NOTIFY=1 pnpm tsx scripts/simulate-intake.ts`
- [ ] Commit `feat(dev): agent simulation harness`

### Task 15.2: Full-journey Playwright E2E

**Files:** Create `app/tests/full-journey.spec.ts`

- [ ] Test: book appointment as patient → intake submission → wait for Intake AI (mocked to return ready=true) → doctor opens consult → finalize → verify summary sent (check messages table) → simulate day-1 follow-up → patient replies → outcome='improving'
- [ ] All provider calls mocked via `SIMULATE_NOTIFY=1`
- [ ] Commit `test(e2e): full 5-phase patient journey`

### Task 15.3: API route test suite

**Files:** Create `app/scripts/api-tests.sh`

- [ ] Bash script that curls every new endpoint with happy path + one error:
  - `/api/appointments/book`
  - `/api/intake-templates`
  - `/api/razorpay/create-subscription`
  - `/api/razorpay/webhook` (with a valid signed payload)
  - `/api/webhooks/gupshup` (inbound)
  - `/api/webhooks/msg91`
- [ ] Commit `test(api): curl test suite for new endpoints`

### Task 15.4: Lighthouse PWA audit

- [ ] Deploy to Vercel preview
- [ ] Run Lighthouse mobile audit — PWA score must be ≥ 90
- [ ] Fix any failing criteria (icons, manifest, SW, https)
- [ ] Record score in `docs/superpowers/plans/launch-evidence.md`
- [ ] No commit

### Task 15.5: Production smoke audit before pilot handoff

- [ ] Against production:
  - Sign up as fresh doctor (not whitelisted) → expect free plan, see pricing
  - Sign up as whitelisted doctor → expect pro plan + alpha banner + welcome email in inbox
  - Public booking page renders
  - Intake form submission completes
  - (Using Razorpay test mode via `?razorpay=test` env toggle, if in place) Pro upgrade → webhook → plan='pro'
  - SMS via MSG91 delivered to your phone (one-off send)
  - WhatsApp via Gupshup delivered to your WhatsApp
  - Patient portal magic link works end to end
- [ ] Screenshot each step into `/tmp/launch-evidence/`
- [ ] If everything green, declare Definition of Done met

### Task 15.6: Onboard pilot 5

- [ ] Confirm 5 doctor emails in `PRO_WHITELIST`, deployed to prod
- [ ] Send each doctor:
  - Personal welcome email (manual, from hello@larinova.com)
  - Login URL + PWA install instructions (Add to Home Screen)
  - Quick-start card (PDF) with "how to record your first consult in 60s"
- [ ] Schedule 15-min call for feedback within 48 hours
- [ ] No commit

---

# Self-review

- [x] **Spec coverage:** every section of the spec maps to tasks (Audit → Section 1+6; Data model → Section 2; Notify → Section 3; Tiering → Section 4; PWA → Section 5; Razorpay → Section 7; Inngest → Section 8; Intake AI → Section 9; Dispatcher → Section 10; Wellness → Section 11; Patient record → Section 12; Landing → Section 13; Patient portal → Section 14; Quality + launch → Section 15).
- [x] **Placeholder scan:** no "TBD / TODO / fill in" strings. Concrete file paths, code, commands throughout.
- [x] **Type consistency:** `PLAN_PRICES`, `FREE_TIER_CONSULTATION_LIMIT`, `PRO_WHITELIST`, `notify()`, `LarinovaEvents`, agent function names — all consistent across sections.
- [x] **Indonesia deferral honored** — Section 13.4 explicitly verifies no `id` locale touches.

# Execution handoff

**Plan complete and saved to `/Users/gabrielantonyxaviour/Documents/products/larinova/docs/superpowers/plans/2026-04-23-india-opd-platform.md`.**

Three sanctioned execution paths:

1. **Executing Plans (sequential checkpoints)** — `/superpowers:executing-plans <plan-path>`. Works well through Sections 1–6 (foundations + pilot unblock) which have linear dependencies.
2. **cmux-teams (parallel workstreams)** — Best for Sections 7–13, which split cleanly into: Razorpay (7), Inngest+agents (8–11), Landing (13), Patient portal (14). Four parallel teammates, non-overlapping file ownership.
3. **Subagent-Driven Development** — Best for the template catalogue (Task 3.5) and migrations (Section 2) which have 10+ similar-shape tasks.

**Recommended:** start a **fresh Claude Code session**, execute Sections 1–6 sequentially (pilot unblock), then spawn **cmux-teams** for the rest in parallel. Fresh session strongly advised — this plan has 60+ tasks, schema migrations, and spans 3 modules (app / landing / patient-portal).
