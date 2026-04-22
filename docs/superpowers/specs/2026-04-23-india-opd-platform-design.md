# Larinova — India OPD Platform (design spec)

**Date:** 2026-04-23
**Locale in scope:** `in` (India, English) only
**Locale deferred:** `id` (Indonesia) — code paths preserved, not shipped
**Status:** design approved, pending implementation plan

---

## 1. Goal

Ship a complete end-to-end OPD (outpatient department) platform for Indian solo and small-clinic doctors. The patient travels through five phases — Booking → Intake → Pre-consult Prep → Consult → Follow-up — with AI agents running behind the scenes and three notification rails (Email, SMS, WhatsApp) keeping the patient in the loop. Doctor pays via Razorpay Live; whitelisted alpha doctors get Pro tier free. Patient-facing website is optional — the full journey works over messaging alone.

## 2. Context

- Existing app (`app/`) is a Next.js medical scribe with voice → SOAP → ICD-10 → Rx → PDF. That scribe is the core of the OPD product; it does not change in this spec.
- Existing plumbing already present and usable: booking scaffolding (`lib/booking/`), public booking page (`landing/src/app/book/`), intake survey scaffolding (`landing/src/app/[locale]/discovery-survey/`), Razorpay + Xendit webhook/verify/subscription routes, Helena medical chat, prescription routes, formulary/medicines search, Resend email, Sarvam STT, Supabase auth + RLS, Vercel deployment to `larinova-mvp-app`.
- No Indonesia work in this spec. All new code paths are locale-aware (Indonesia can be lit up later as a provider-swap + data change, not a refactor).

## 3. Non-negotiable principles

1. **One locale in scope — India.** Indonesia scaffolding stays intact; no Bahasa work done; `default` = USD removed and replaced with explicit `ID` = IDR row (display-only until Xendit ships).
2. **Patient low-friction.** A patient can complete booking → consult → follow-up without ever visiting a website. Primary rails are WhatsApp + Email + SMS. The patient portal at `patient.larinova.com` exists for document upload, appointment reschedule, and viewing outputs, accessed by magic link, no account creation.
3. **Every AI decision is logged and replayable.** Every agent run writes an entry to `agent_jobs` with inputs, outputs, model, cost, and links to the messages it generated. Doctor can audit.
4. **One comms module.** All Email/SMS/WhatsApp traffic goes through `lib/notify/` — `notify(channel, template, data, recipient)`. Agents never call Resend / MSG91 / Gupshup directly.
5. **All AI inference via Claude Service** (`https://claude.fierypools.fun`) per global rule `~/.claude/rules/claude-service.md`. No direct Anthropic / OpenAI / Gemini calls from app code.
6. **Locale-aware by construction.** Every new table, every agent config, every notification template carries a `locale` column. Indonesia enablement = add rows.

## 4. Scope

### In scope
- Audit + fix existing features in the `in` locale against local and production
- Free / Pro tier gating (20 consultations/month free; Pro unlimited)
- `PRO_WHITELIST` email list in code; 5 pilot doctors upgraded on whitelist
- Alpha-doctor welcome banner + Resend welcome email
- Razorpay Live subscription for Pro (monthly + yearly)
- `types/billing.ts` gets explicit `IN`, `ID`, `default` rows (IDR added)
- India landing page fully reframed OPD-first (scroll narrative, live Razorpay Checkout on pricing)
- PWA on `app.larinova.com` (manifest, icons, service worker)
- New data: `appointments`, `intake_templates`, `intake_submissions`, `patient_documents`, `messages`, `agent_jobs`, `follow_up_threads`, `patient_narrative`
- **Three new AI agents:**
  1. Pre-consult Intake AI
  2. Post-consult Dispatcher
  3. Wellness Follow-up Agent (conversational)
- `lib/notify/` unified module: Email (Resend), SMS (MSG91), WhatsApp (Gupshup)
- Inngest queue for agent orchestration; Supabase `pg_cron` for trivial periodic jobs only
- Patient portal at `patient.larinova.com` (separate Next.js + Vercel project, magic-link auth, shared Supabase DB)
- Patient-record structured view: AI-generated 3-sentence narrative + full timeline
- Playwright E2E coverage of the full 5-phase journey in `in` locale
- API route tests (bash + curl) for every new endpoint
- Agent simulation harness for dev-time testing without calling real patients

### Out of scope (this spec)
- Indonesia: Xendit wiring, Bahasa landing rewrite, Deepgram changes, `id` patient portal
- Meta WhatsApp Cloud API migration (Gupshup only for now)
- 4-tier Starter/Basic/Pro/Business pricing (future, per `docs/PRICING_IMPLEMENTATION_INSTRUCTIONS.md`)
- Multi-doctor clinic mode / reception staff role
- ABDM / ABHA integration
- Drug interaction warnings (requires dedicated clinical content work)
- Offline recording / background sync
- Push notifications
- Day-end analytics dashboard
- Tele-consultation / video calls
- Any Indonesia-facing changes to the marketing site

## 5. Architecture

### 5.1 Surfaces

| Audience | URL | Stack | Notes |
|---|---|---|---|
| Doctor app | `app.larinova.com/in` | Next.js App Router, Supabase, PWA | Existing; repositioned home = queue |
| Public doctor booking | `app.larinova.com/book/[slug]` | Next.js | Existing scaffold; extend with intake submission |
| Landing | `larinova.com/in` | Next.js | Full OPD-first reframe |
| **Patient portal (new)** | `patient.larinova.com` | Next.js, separate Vercel project | Magic-link auth; 5 routes; shared Supabase DB |

### 5.2 Patient journey

```
 ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐
 │  1. BOOK    │ → │  2. INTAKE   │ → │  3. PREP     │ → │  4. CONSULT  │ → │  5. FOLLOW-UP │
 └─────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └───────────────┘
  Public booking    Fixed intake     Intake AI reads   Doctor opens       Wellness agent
  page; patient     template (per    form + past       patient on         opens WhatsApp
  picks slot;       clinic). Patient history;          consult screen.    1d / 3d / 7d.
  fills contact +   attaches docs.   decides more      Records voice.     Conversational.
  chief complaint.  Patient-facing   info needed;      Existing scribe    Classifies outcome.
                    on patient       requests via      runs: SOAP +       Flags doctor if
  Confirmation      portal OR        WA/email; when    ICD-10 + Rx.       concerning.
  email+SMS+WA.     WA/email intake  ready, writes     Doctor reviews,
                    link.            Prep Brief.       adjusts, signs.
  Reminders 1d,
  1h before.                         Doctor reads 60s  Post-consult
                                     before consult.   Dispatcher sends
                                                       summary + Rx via
                                                       email + WA + SMS.
```

Every transition emits an event (Inngest) that the relevant agent subscribes to.

### 5.3 AI agents

All three new agents run as **Inngest functions**. Each is a TypeScript file in `app/lib/agents/`.

#### Agent 1 — Pre-consult Intake AI (`agents/intake.ts`)

- **Trigger event:** `intake.submitted` (fired when patient saves their intake form)
- **Inputs:** intake form (jsonb), chief complaint, returning-patient history, uploaded documents
- **Steps:**
  1. Read existing patient record (if any)
  2. Call Claude Service (Sonnet) with a structured prompt: "given this intake + history, does the doctor need more information or documents before the consult? If yes, which specific questions or documents?"
  3. If the AI requests more info: write an outgoing message (Email + WhatsApp; SMS as last resort) asking the patient. Save `agent_jobs` step.
  4. On patient reply (via WhatsApp webhook or patient portal upload): re-evaluate. Loop up to 3 rounds or until AI returns `ready=true`.
  5. When `ready`: generate the **Prep Brief** — markdown, written for the doctor's eyes. Stored on `appointments.prep_brief` (jsonb with `summary`, `red_flags`, `suggested_questions`, `medications_to_review`).
- **Guardrails:** never ask the patient more than 3 rounds of questions; never request private government IDs, bank info, unrelated PII; always include a "skip — tell the doctor in person" option in every request.

#### Agent 2 — Post-consult Dispatcher (`agents/dispatcher.ts`)

- **Trigger event:** `consultation.finalized` (fired when doctor signs off the consult)
- **Steps:**
  1. Read consultation record: SOAP, Rx, ICD-10, follow-up instructions
  2. Generate **patient-readable SOAP** (Sonnet, one paragraph, non-clinical English) — distinct from the clinical SOAP
  3. Render Rx PDF (existing renderer, India format)
  4. Send **Email** (Resend): clinical-friendly summary + Rx PDF attached
  5. Send **WhatsApp** (Gupshup): patient-readable SOAP + Rx PDF link (hosted on patient portal)
  6. Send **SMS** (MSG91): short confirmation + magic-link to full record on patient portal
  7. Schedule follow-up agent run(s) based on consultation's `follow_up_schedule` (default: 1d + 3d + 7d, configurable per doctor or per diagnosis)

#### Agent 3 — Wellness Follow-up Agent (`agents/wellness.ts`)

- **Trigger event:** `followup.scheduled` (scheduled by dispatcher)
- **Inputs:** consultation record, schedule tier (day-1 / day-3 / day-7)
- **Conversational loop** over WhatsApp (Gupshup inbound webhook → `messages.inbound.whatsapp` event → agent step):
  1. Agent opens with a tier-appropriate question ("How's the fever today, Raj?")
  2. Patient replies; agent interprets and decides next move:
     - Probe deeper: "On a 1–10, how's the pain compared to yesterday?"
     - Escalate: "I'd like to let Dr. Priya know — do you want to book a follow-up?"
     - Close: "Glad to hear. I'll check in again in 2 days."
  3. Agent classifies outcome after each exchange: `improving | unchanged | flagged`
- **On flagged:** agent writes `follow_up_threads.flagged=true`, `doctor_notified_at=now()`, sends in-app notification + email to doctor with the conversation snippet and a one-click reschedule link
- **Concurrency control:** only one active thread per patient at a time; if a new follow-up is scheduled while one is open, it appends to the existing thread
- **Escape hatch:** patient can reply `STOP` to any follow-up; agent suspends the thread and notifies doctor

### 5.4 Queue / orchestration — Inngest

- **Why Inngest:** event-driven, durable steps with automatic retries + backoff, built for AI agents with long-running conversations spanning days, TypeScript-first, free tier covers MVP comfortably, observability UI out of the box
- **Setup:** `app/inngest/client.ts` exports a single Inngest client; `app/app/api/inngest/route.ts` exposes the serve endpoint; functions live in `app/inngest/functions/*.ts`
- **Events emitted:**
  - `appointment.booked`
  - `intake.submitted`
  - `intake.info_requested` (agent → patient)
  - `intake.info_received` (patient → agent)
  - `intake.prep_ready`
  - `consultation.started`
  - `consultation.finalized`
  - `followup.scheduled`
  - `followup.message_sent`
  - `followup.message_received`
  - `followup.flagged`
  - `payment.subscription_activated`
  - `payment.subscription_failed`
- **Supabase `pg_cron`:** only used for monthly consultation counter reset and nightly `patient_narrative` regeneration batch

### 5.5 Data model

All new tables include `locale text not null default 'in'` and appropriate Supabase RLS policies (doctor-scoped via `doctor_id`; patient-scoped on patient portal views via `patient_id + magic_link_token`).

```sql
-- Appointments
create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references doctors(id),
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status text not null check (status in ('booked','confirmed','cancelled','no_show','completed')),
  chief_complaint text,
  intake_template_id uuid references intake_templates(id),
  intake_submission_id uuid references intake_submissions(id),
  prep_brief jsonb,
  locale text not null default 'in',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Intake form templates (doctor defines them)
create table intake_templates (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id),
  title text not null,
  description text,
  fields jsonb not null,     -- [{ id, type, label, required, options }]
  is_default boolean default false,
  locale text not null default 'in',
  created_at timestamptz default now()
);

-- Patient's intake submission for a specific appointment
create table intake_submissions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  patient_id uuid not null references patients(id),
  form_data jsonb not null,
  ai_followup_rounds integer default 0,
  submitted_at timestamptz default now()
);

-- Uploaded documents (lab reports, photos, etc.)
create table patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  appointment_id uuid references appointments(id),
  uploader text not null check (uploader in ('patient','doctor','agent')),
  kind text not null check (kind in ('lab_report','image','prescription','other')),
  storage_path text not null,
  original_filename text,
  mime_type text,
  ai_summary jsonb,
  uploaded_at timestamptz default now()
);

-- All outbound + inbound messages across all channels
create table messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  doctor_id uuid references doctors(id),
  channel text not null check (channel in ('email','sms','whatsapp','in_app')),
  direction text not null check (direction in ('out','in')),
  template_key text,              -- e.g. 'appointment_confirmation', 'followup_day3'
  body text not null,
  related_entity_type text,       -- 'appointment' | 'consultation' | 'follow_up_thread' | ...
  related_entity_id uuid,
  provider text,                  -- 'resend' | 'msg91' | 'gupshup'
  provider_msg_id text,
  status text check (status in ('queued','sent','delivered','read','failed','replied')),
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index on messages (patient_id, created_at desc);

-- Agent job runs (observability + retries)
create table agent_jobs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,             -- 'intake' | 'dispatcher' | 'wellness'
  event text not null,
  payload jsonb,
  result jsonb,
  status text check (status in ('pending','running','succeeded','failed','dead_lettered')),
  attempts integer default 0,
  last_error text,
  model text,                      -- 'claude-sonnet-4-6' etc.
  tokens_input integer,
  tokens_output integer,
  cost_cents integer,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);
create index on agent_jobs (agent, status, created_at desc);

-- Wellness follow-up conversation threads
create table follow_up_threads (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  consultation_id uuid not null references consultations(id),
  schedule jsonb not null,        -- [{ tier: 'day-1', scheduled_for: '...', sent: false }, ...]
  transcript jsonb not null default '[]'::jsonb,   -- [{ role: 'agent'|'patient', body, at }]
  outcome text check (outcome in ('improving','unchanged','flagged','closed')),
  flagged boolean default false,
  doctor_notified_at timestamptz,
  patient_opted_out boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Per-patient AI-generated narrative (regenerated on each new consultation)
create table patient_narrative (
  patient_id uuid primary key references patients(id),
  summary_md text not null,        -- 3–5 sentences, doctor-facing
  source_consultation_ids uuid[] not null,
  generated_at timestamptz default now()
);
```

Existing `patients`, `consultations`, `doctors`, `prescriptions` tables extended only via new columns where necessary — **no destructive migrations**:

```sql
alter table doctors add column plan text not null default 'free' check (plan in ('free','pro'));
alter table doctors add column razorpay_customer_id text;
alter table doctors add column razorpay_subscription_id text;
alter table doctors add column subscription_status text check (subscription_status in ('active','cancelled','past_due','trialing','whitelisted'));
alter table doctors add column alpha_welcomed_at timestamptz;

alter table consultations add column appointment_id uuid references appointments(id);
alter table consultations add column follow_up_schedule jsonb;   -- overrides default
```

### 5.6 External integrations

| Provider | Use | Env vars |
|---|---|---|
| **MSG91** | SMS, India, DLT-compliant | `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_DLT_TEMPLATE_IDS` (JSON object of named templates: `appointment_confirmation`, `appointment_reminder_1d`, `appointment_reminder_1h`, `consultation_summary_link`, `followup_prompt`) |
| **Gupshup** | WhatsApp Business (inbound + outbound) | `GUPSHUP_API_KEY`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`, `GUPSHUP_WEBHOOK_SECRET` |
| **Razorpay Live** | Pro subscription | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_PLAN_ID_PRO_MONTHLY`, `RAZORPAY_PLAN_ID_PRO_YEARLY` |
| **Inngest** | Queue / agent orchestration | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| **Supabase Storage** | Patient uploads | existing env vars; new bucket `patient-documents` with RLS |
| Resend, Sarvam, Claude Service | unchanged | unchanged |

### 5.7 `lib/notify/` module

```
app/lib/notify/
  index.ts         — notify(channel, template, data, recipient) entry point
  email.ts         — Resend wrapper
  sms.ts           — MSG91 wrapper
  whatsapp.ts      — Gupshup outbound wrapper
  webhooks/
    gupshup.ts     — inbound WhatsApp handler (→ emits Inngest events)
    msg91.ts       — delivery status webhook
    resend.ts      — open/click webhook
  templates/
    appointment_confirmation/{email,sms,whatsapp}.ts
    appointment_reminder_1d/{email,sms,whatsapp}.ts
    appointment_reminder_1h/{email,sms,whatsapp}.ts
    consultation_summary/{email,sms,whatsapp}.ts
    intake_info_request/{email,whatsapp}.ts
    followup_prompt/{whatsapp}.ts
    welcome_alpha/{email}.ts
```

Every outbound `notify()` call writes a row to `messages` with `status='queued'` before dispatch; updates on delivery webhook.

## 6. Feature specs by surface

### 6.1 Doctor app (`app.larinova.com/in`)

**Home (changed):** queue-first.
- Hero: "Next patient" card — big button labeled "Start consult"
- Sidebar: today's patients (booked, confirmed, in, done), filterable
- No stat cards

**Consult screen (small changes):**
- Banner at top: "Prep Brief" collapsible panel (red-flag highlights if any)
- Existing record → SOAP → ICD-10 → Rx flow unchanged
- New: "Send to patient" confirmation modal when doctor signs off → triggers Dispatcher

**Patient detail page (new):**
- Top: AI-generated `patient_narrative` summary (3–5 sentences, regenerated on each new consultation)
- Timeline below: appointments, consults, documents, follow-up threads, messages — interleaved chronologically
- "Ask AI about this patient" floating action (existing Helena chat, scoped to this patient)

**Intake templates (new):**
- Settings → "Intake templates"
- Form builder for doctor-defined intake schemas (simple fields: short text, long text, single/multi select, number, date, yes/no, file upload)
- Mark one as default; per-appointment template selection is future

**Billing page (updated):**
- Current: "Coming Soon" overlay — removed
- Free plan: shows current consultation count + 20-cap + "Upgrade to Pro" CTA
- Pro plan (active): shows next renewal date, plan price, "Manage billing" (redirect to Razorpay hosted customer portal if available; otherwise an email link)
- Pro plan (whitelisted): shows "Alpha doctor — thank you" badge, no renewal/billing info

### 6.2 Landing page (India, `larinova.com/in`)

Full rewrite of `landing/src/app/[locale]/` for `in` locale only.

**Hero:**
> **Larinova — the OPD assistant for Indian doctors.**
> See more patients. Type less. Send prescriptions on WhatsApp.
> CTA: "Start free" → `https://app.larinova.com/in/signup`

**Feature section:** scroll-scrubbed 5-phase narrative, one viewport per phase, GSAP ScrollTrigger + Lenis (per global UI rules). No card grids, no bento. Each phase shows:
- Phase 1 — BOOK: animated calendar picker
- Phase 2 — INTAKE: live form filling mock
- Phase 3 — PREP: Prep Brief rendering
- Phase 4 — CONSULT: waveform + transcript streaming
- Phase 5 — FOLLOW-UP: WhatsApp thread animation

**Pricing section:** 2 tiers visible.
- Free — ₹0/month, 20 consults/month, no credit card
- Pro — ₹1,500/month or ₹15,000/year (17% off badge), unlimited consults
- Monthly / annual toggle
- "Subscribe to Pro" button → Razorpay Checkout modal (client-side Razorpay.js)
- Enterprise strip below: `mailto:hello@larinova.com`

**No Indonesia changes.** `landing/src/app/[locale]/` under `id` locale remains on the current copy.

### 6.3 Patient portal (`patient.larinova.com`, new)

Separate Next.js App Router project, separate Vercel project, shared Supabase DB. `.env` reads the same `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the main app.

**Auth:** Supabase `signInWithOtp({ email })` — magic link. No passwords. Any SMS/Email/WhatsApp message to the patient includes the magic-link URL. Token valid for 30 days with refresh. RLS policies scope patient_id via JWT claim.

**Routes (5):**
1. `/` — current appointment card (if any), recent Rx, open follow-up status
2. `/appointments/[id]` — appointment detail + reschedule + cancel + upload documents
3. `/appointments/[id]/intake` — fill / edit intake form
4. `/prescriptions/[id]` — view Rx + download PDF
5. `/documents` — patient's uploaded documents + AI-requested uploads pending

**Design:** minimal. Large fonts, mobile-first, single-column, no chrome. Light/dark via system preference. Hindi/Tamil support via same `next-intl` setup.

**Deployment:** subdomain `patient.larinova.com` pointed at its own Vercel project `larinova-patient-portal`.

### 6.4 Public booking (`app.larinova.com/book/[slug]`)

Extends existing scaffolding. Flow:
1. Patient lands on doctor's page (existing)
2. Picks a slot (existing)
3. Enters contact + chief complaint (existing)
4. **New:** if the doctor has a default `intake_template`, patient fills it here or gets a magic-link to fill it later
5. Submit → `appointments` row + `intake_submissions` row → emit `appointment.booked` + `intake.submitted` events
6. Confirmation: email + SMS + WhatsApp, each with reschedule link (patient portal magic-link)
7. Reminders: 1d and 1h before (scheduled via Inngest `step.sleep`)

## 7. Billing + tiering

**Updated `types/billing.ts`:**

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

export const FREE_TIER_CONSULTATION_LIMIT = 20;  // consultations/month
```

**Enforcement:** `app/app/api/consultations/start/route.ts` wraps in a tier guard:
```
if (doctor.plan === 'free' && monthlyConsultationCount >= 20) {
  return json({ error: 'free_tier_exhausted', limit: 20, used: monthlyConsultationCount }, 402);
}
```

**Whitelist:** `app/lib/subscription.ts`:
```ts
export const PRO_WHITELIST: readonly string[] = [
  // 5 pilot doctors — filled in at deploy time
];
```
On every login, if `doctor.email` in `PRO_WHITELIST` and `plan !== 'pro'`, upgrade: `plan='pro'`, `subscription_status='whitelisted'`, `razorpay_subscription_id=null`. Trigger alpha welcome flow.

**Alpha welcome:**
- First post-whitelist login: banner at top of app home ("You're one of our first alpha doctors — thank you.") dismissible, stored in localStorage
- One-time Resend email: template `welcome_alpha`, from `hello@larinova.com`, subject "Welcome to Larinova, alpha doctor"
- `doctors.alpha_welcomed_at = now()` marker

**Razorpay Checkout flow:**
1. User clicks "Upgrade to Pro" on billing page or landing
2. Client calls `POST /api/razorpay/create-subscription` with `{plan: 'pro', interval: 'month'|'year'}`
3. Server creates Razorpay subscription, returns `subscription_id + short_url`
4. Razorpay Checkout modal opens (client)
5. Payment authorised → Razorpay webhook `subscription.activated` → server sets `doctor.plan='pro'`, `subscription_status='active'`, `razorpay_subscription_id=...`
6. Success page → redirect into app

## 8. PWA

- `app/public/manifest.webmanifest` — `name`, `short_name`, `start_url=/in`, `display=standalone`, `theme_color`, `background_color`, icons
- Icons generated from existing `logo-gen/` assets: 192x192, 512x512, 180x180 (Apple touch), maskable 512x512
- Service worker via `next-pwa`: offline fallback page only; API routes NOT cached; shell pages cached with stale-while-revalidate
- Apple-specific meta tags in `app/[locale]/layout.tsx`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`
- Android: installability verified via Chrome Lighthouse PWA audit

## 9. Notifications — template catalogue

Every template exists in 3 channels (where applicable). Templates live in `app/lib/notify/templates/<key>/{email.ts, sms.ts, whatsapp.ts}`. Each template is a function `(data) => { subject?, body, attachments? }`.

| Template key | Channels | Trigger |
|---|---|---|
| `appointment_confirmation` | email, sms, whatsapp | On booking |
| `appointment_reminder_1d` | email, sms, whatsapp | 24h before slot |
| `appointment_reminder_1h` | sms, whatsapp | 1h before slot |
| `intake_info_request` | email, whatsapp | Intake AI requests more info |
| `consultation_summary` | email (PDF attached), whatsapp (PDF link), sms (short link) | Post-consult |
| `followup_prompt_day1` | whatsapp | 24h after consult |
| `followup_prompt_day3` | whatsapp | 72h after consult |
| `followup_prompt_day7` | whatsapp | 7d after consult |
| `followup_flagged_doctor` | email, in_app | Wellness agent flags |
| `welcome_alpha` | email | First login as whitelisted pro |
| `subscription_activated` | email | Razorpay webhook |
| `subscription_payment_failed` | email | Razorpay webhook |

DLT template approvals for SMS are pre-filed via MSG91 dashboard before launch; template IDs stored in `MSG91_DLT_TEMPLATE_IDS` env JSON.

## 10. Observability

- **Messages log** — `messages` table is the source of truth for every patient communication; UI surface in doctor app at Settings → Message Log
- **Agent logs** — `agent_jobs` table; UI surface at Settings → Agent Runs (admin only)
- **Inngest dashboard** — step-level visibility, production URL bookmarked in CLAUDE.md
- **Razorpay dashboard** — canonical for payments
- **Vercel logs** — canonical for runtime errors
- **Supabase logs** — canonical for DB + auth

No new analytics provider (PostHog / Mixpanel) in this spec.

## 11. Environment variables

Added to `app/.env.example` and Vercel production env:

```
# MSG91 (SMS, India)
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_DLT_TEMPLATE_IDS='{"appointment_confirmation":"","appointment_reminder_1d":"","appointment_reminder_1h":"","consultation_summary_link":"","followup_prompt":""}'

# Gupshup (WhatsApp)
GUPSHUP_API_KEY=
GUPSHUP_APP_NAME=
GUPSHUP_SOURCE_NUMBER=
GUPSHUP_WEBHOOK_SECRET=

# Razorpay (Live)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_PLAN_ID_PRO_MONTHLY=
RAZORPAY_PLAN_ID_PRO_YEARLY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Claude Service (global rule)
CLAUDE_SERVICE_URL=https://claude.fierypools.fun
CLAUDE_SERVICE_API_KEY=

# Patient portal
NEXT_PUBLIC_PATIENT_PORTAL_URL=https://patient.larinova.com
```

Patient portal project env: same Supabase keys + `NEXT_PUBLIC_APP_URL=https://patient.larinova.com`.

## 12. Testing strategy

- **Playwright E2E** — one test file per patient-journey phase in `app/tests/`. Uses `playwright-cli-sessions` with a seeded `doctor-in-test` session. Covers:
  - Book appointment → confirmation received
  - Fill intake → AI follow-up round → mark ready
  - Doctor opens Prep Brief → starts consult → scribe runs → finalises
  - Dispatcher delivers email + WhatsApp + SMS (mocked at provider layer)
  - Wellness agent conversation (3 turns) → flag path → doctor notification
  - Razorpay checkout test-mode subscription → webhook activation
- **Agent simulation harness** — `app/scripts/simulate-agent.ts` fires a fake appointment through Inngest dev server, uses a dev inbox (Mailhog / local Gupshup stub), prints the full conversation to stdout. Run via `pnpm sim:intake`, `pnpm sim:wellness`.
- **API tests** — bash + curl against local `pnpm dev`, happy path + one error per endpoint, in `app/scripts/api-tests.sh`.
- **Lighthouse PWA audit** — must score ≥ 90 on PWA category before launch.

## 13. Quality gates

Before pilot launch:
1. `pnpm typecheck` passes
2. `pnpm lint` passes
3. Playwright suite green against production
4. Lighthouse PWA ≥ 90
5. Manual audit: one real SMS, one real WhatsApp, one Razorpay test-mode payment, one end-to-end patient journey on production
6. 5 pilot doctors in `PRO_WHITELIST`, each received alpha welcome email in their inbox
7. Inngest dashboard shows zero failed jobs in the last 24h
8. Dead-letter queue is empty

## 14. Rollout plan

1. Create Vercel project `larinova-patient-portal` + DNS `patient.larinova.com`
2. Apply migrations (append to `APPLY_MIGRATIONS.sql` or ship as a new numbered migration file)
3. Configure Razorpay dashboard (plans, webhook, bank payouts confirmed)
4. Register MSG91 DLT templates
5. Register Gupshup WhatsApp Business + webhook
6. Deploy app + patient portal + landing to Vercel production
7. Add 5 pilot emails to `PRO_WHITELIST`, deploy again
8. Final audit pass (quality gates above)
9. Hand phones to pilot doctors

## 15. Definition of done

All of the following must be true:
- [ ] Every existing feature works in `in` locale on production (audit pass)
- [ ] Free tier 20-consult cap enforced server-side with friendly UX on limit
- [ ] 5 pilot doctors whitelisted + received alpha welcome email
- [ ] Razorpay Live: plans exist, webhook verified, Checkout modal completes a test-mode payment
- [ ] India landing fully OPD-first (hero + 5-phase scroll narrative + 2-tier pricing with Razorpay Checkout)
- [ ] PWA installable on iOS and Android (Lighthouse ≥ 90)
- [ ] Patient portal live at `patient.larinova.com` with magic-link auth and 5 routes
- [ ] MSG91 sending DLT-approved SMS; delivery webhook updating `messages` status
- [ ] Gupshup sending WhatsApp; inbound webhook routing to Inngest events
- [ ] Pre-consult Intake AI: full loop (form → AI decision → patient follow-up → prep brief)
- [ ] Post-consult Dispatcher: SOAP + Rx delivered via email + WhatsApp + SMS
- [ ] Wellness Follow-up Agent: real back-and-forth conversation, outcome classification, doctor flagging
- [ ] Returning-patient AI narrative regenerated on each consult, visible at top of patient page
- [ ] All env vars documented in `app/.env.example`
- [ ] Full Playwright suite green
- [ ] Agent simulation harness works for intake + wellness
- [ ] Observability: `messages`, `agent_jobs`, Inngest dashboards all populated

## 16. Explicit Indonesia stance

Indonesia is out of scope **but is not broken by this spec**. Specifically:
- `PLAN_PRICES.ID` row is added (display-only)
- All new tables carry `locale` with `default 'in'`; Indonesia rows can be added later
- `lib/notify/` is locale-aware — `id` templates are simply added later
- MSG91 / Gupshup are India-only providers; Indonesia will swap to Vonage / Twilio + Meta Cloud API (or Gupshup's Indonesia entity if they have one) in a later spec
- Xendit scaffolding remains untouched for a future Indonesia billing spec
- Landing page `id` locale is NOT rewritten in this spec

The explicit follow-up spec — **"Larinova Indonesia Enablement"** — will cover Xendit billing, Bahasa landing OPD rewrite, Indonesian provider wiring, Deepgram tuning, and `id`-locale patient portal copy.
