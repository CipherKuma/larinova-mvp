# Admin Panel + Custom Analytics + Issue Reporting

**Date:** 2026-04-26
**Author:** Gabriel Antony Xaviour
**Scope:** App at `app.larinova.com` (`/Users/gabrielantonyxaviour/Documents/products/larinova/app`)

---

## 1. Goal

Three connected subsystems that together give the founder operational visibility and the alpha doctors a feedback channel:

1. **Admin shell** — a `/admin` area gated to a single email (`gabrielantony56@gmail.com`) where Gabriel can view all signed-up doctors, all survey responses from the landing site, current invite-code state, and key business metrics. Mints new invite codes on demand.
2. **Custom product analytics** — a self-hosted event-tracking pipeline that captures page views, clicks, and milestone events. No third-party SaaS (no PostHog, no Mixpanel). Drives a per-session timeline and funnel/retention dashboards in `/admin/analytics`.
3. **Issue reporting** — every authenticated doctor can file an issue from inside the app. Each issue has a threaded chat between the reporter and the admin. Doctors see only their own issues; admin sees all. No AI auto-triage.

## 2. Why

- **Operational truth.** Currently, Gabriel has zero in-product way to see who's active, who's stuck, or who hasn't logged in since redemption. SQL queries via Supabase Studio aren't a workflow.
- **Code generation can't be a SQL ritual.** Every new pilot or partnership requires inserting into `larinova_invite_codes`. Admin UI fixes that.
- **Behavioral intuition.** During alpha, the most valuable signal is "where did they get stuck?" — heatmap-grade granularity isn't required, but the click + page-view event timeline per doctor is.
- **Feedback channel.** Without an in-product issue path, alpha doctors will message Gabriel on WhatsApp/email — fragmented, lost, no shared context with the bug. An in-app `/issues` page with chat keeps everything threaded.
- **Privacy + cost.** Opting out of PostHog/Mixpanel keeps user behavior on Supabase (already trusted with patient data, already has RLS). No vendor data leak risk, no per-event metering.

## 3. Decided

- **Admin email allowlist:** single email `gabrielantony56@gmail.com`. Stored in `lib/admin.ts` constant (not env, so it's source-controlled and reviewable).
- **Auth:** uses the existing email/password (or magic-link) Supabase auth. No second factor for admin in v1.
- **Analytics scope:** page views + click events + milestone events + per-session timeline. **NOT** session replay (rrweb-grade DOM snapshotting), **NOT** real-time live-cursor view. Heatmaps deferred to v2.
- **Anonymous tracking:** pre-auth visitors get an `anonymous_id` cookie; once they sign up, their pre-auth events are linked to their `user_id`.
- **Privacy:** event tracker NEVER captures input field values. Only that the field was focused/blurred. Patient names, transcripts, prescriptions, emails — never logged. Server-side milestone events log the entity ID only, never the body.
- **Issues — doctor isolation:** RLS-enforced. Doctor cannot read or guess another doctor's issue ID.
- **Issues — chat realtime:** polling-on-focus in v1. Supabase realtime subscriptions in v2.
- **Issues — no AI auto-fix:** Gabriel triages and fixes manually using Claude in his own terminal. Chat thread is for back-and-forth with the doctor; status changes are admin-only.
- **Email on issue file:** admin gets an email on every new issue (Resend, low-volume). Doctor does NOT get email per admin reply (they'll see it next time they open the app — avoids notification fatigue).
- **Phased delivery:** Phase A (admin shell), Phase B (analytics), Phase C (issues). Each phase ships independently and is independently usable.

## 4. Out of scope

- Session replay / DOM snapshot recording
- Heatmaps (visual click density overlays on screenshots)
- Real-time live-user view ("Dr. Ramesh is currently on /consultations")
- Multi-admin support (multi-tenancy of admin role) — single-admin only in v1
- Issue assignment / labels / projects — flat list with status only
- AI-powered issue triage / suggested fix (rax pattern) — explicitly rejected
- File attachments on issues — text-only in v1; can add screenshots in v2
- Notifications via WhatsApp/SMS — email only (gates back to v1.1 SMS work)

## 5. Architecture

### 5.1 Admin auth gate

`lib/admin.ts`:
```ts
export const ADMIN_EMAILS = ["gabrielantony56@gmail.com"] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim() as never);
}
```

Two enforcement points:

1. **Middleware** (`proxy.ts`): for any pathname starting with `/admin` or `/api/admin`, after the existing auth check, also verify `isAdminEmail(user.email)`. Non-admins → 404 (not 403; we don't want to confirm the route exists).
2. **Per-route** (server components + API handlers): defense-in-depth — read the user, call `isAdminEmail`, redirect/404 if not admin.

### 5.2 Admin shell — pages

```
app/[locale]/(admin)/admin/layout.tsx   — admin shell with sidebar nav
app/[locale]/(admin)/admin/page.tsx     — overview cards
app/[locale]/(admin)/admin/codes/page.tsx
app/[locale]/(admin)/admin/doctors/page.tsx
app/[locale]/(admin)/admin/doctors/[id]/page.tsx
app/[locale]/(admin)/admin/surveys/page.tsx
app/[locale]/(admin)/admin/analytics/page.tsx
app/[locale]/(admin)/admin/analytics/sessions/[id]/page.tsx
app/[locale]/(admin)/admin/issues/page.tsx
app/[locale]/(admin)/admin/issues/[id]/page.tsx
```

API routes:
```
app/api/admin/codes/list/route.ts          — GET, paginated
app/api/admin/codes/generate/route.ts      — POST { count, note? } → returns inserted codes
app/api/admin/doctors/list/route.ts        — GET, paginated
app/api/admin/surveys/list/route.ts        — GET, paginated, search
app/api/admin/surveys/export/route.ts      — GET, returns CSV
app/api/admin/analytics/timeseries/route.ts — GET ?metric=pageviews&range=7d
app/api/admin/analytics/top-elements/route.ts — GET ?range=7d
app/api/admin/analytics/funnel/route.ts    — GET ?steps=…
app/api/admin/analytics/sessions/route.ts  — GET, list of recent sessions
app/api/admin/analytics/sessions/[id]/route.ts — GET, single-session event timeline
app/api/admin/issues/list/route.ts         — GET, all issues
app/api/admin/issues/[id]/route.ts         — GET single + PATCH status
app/api/admin/issues/[id]/messages/route.ts — POST admin reply
```

#### 5.2.1 `/admin` overview

Cards (each is a single-row aggregate):
- Total signed-up doctors (count of `larinova_doctors`), today / 7d / 30d delta
- Total consultations recorded, this month / total
- Active Pro subscriptions (where `current_period_end > now()`)
- Free tier usage (median consultations/doctor for free users this month)
- Pending issues (status='open' count)
- Unredeemed invite codes count
- Survey responses this week

#### 5.2.2 `/admin/codes`

- Table: code, note, created_at, redeemed_by (doctor name + email if redeemed), redeemed_at, status (unredeemed/redeemed)
- Action: "Generate codes" button → modal with `count` (1-50) and optional `note`
- POST `/api/admin/codes/generate` → server generates `LARINOVA-{6-char-uppercase-alphanumeric}` per code, inserts batch, returns the list (so Gabriel can copy-paste them)

Code format: `LARINOVA-{6 chars, [A-Z0-9] excluding 0/O/1/I for clarity}`. Collision handling: retry on constraint violation, max 5 retries.

#### 5.2.3 `/admin/doctors`

- Table: full_name, email, locale, signup date, redeemed_at, plan + status, consultations this month, last_active_at, link to event timeline
- Filters: plan (free/pro), redeemed (yes/no), search by name/email
- Click row → `/admin/doctors/[id]` (drilldown)

`/admin/doctors/[id]`:
- Doctor profile: name, email, locale, all dates, current subscription
- Recent consultations (last 20)
- Recent events (last 50, link to full timeline at `/admin/analytics/sessions?user_id=...`)
- Recent issues filed by this doctor

#### 5.2.4 `/admin/surveys`

Reads from `larinova_discovery_surveys`. **Verification step (Phase A precondition):** confirm the landing site form posts to this table and that recent rows exist. If the form is broken, fix the API endpoint that writes there. Do not assume it works — test before merging.

- Table: created_at, name (if collected), email, key columns from the survey schema, full response as expandable JSON cell
- Search by name/email
- Export CSV button

#### 5.2.5 `/admin/analytics` — see §5.3 below

#### 5.2.6 `/admin/issues` — see §5.4 below

### 5.3 Custom analytics

#### 5.3.1 Database

Migration `20260426120000_create_analytics_events.sql`:
```sql
CREATE TABLE larinova_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id   TEXT NOT NULL,           -- random per-tab id, persists in sessionStorage
  anonymous_id TEXT NOT NULL,           -- random per-device id, persists in localStorage
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type   TEXT NOT NULL,           -- 'pageview' | 'click' | 'milestone' | etc.
  path         TEXT,                    -- normalized route, e.g. /[locale]/consultations/[id]
  raw_path     TEXT,                    -- actual visited URL path
  element      TEXT,                    -- 'button:Record' | 'a:Open Larinova' | 'data-track:redeem-submit'
  properties   JSONB DEFAULT '{}'::jsonb,
  user_agent   TEXT,
  ip_hash      TEXT,                    -- SHA-256(ip + project_secret), never raw IP
  locale       TEXT
);

CREATE INDEX idx_events_ts ON larinova_events (ts DESC);
CREATE INDEX idx_events_session ON larinova_events (session_id, ts);
CREATE INDEX idx_events_user ON larinova_events (user_id, ts DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_type_path ON larinova_events (event_type, path);

ALTER TABLE larinova_events ENABLE ROW LEVEL SECURITY;
-- No user-facing read policies. Insert via the ingest endpoint (anon key allowed).
-- Service-role reads from /admin/analytics endpoints.

CREATE POLICY events_insert_anon ON larinova_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY events_insert_authed ON larinova_events FOR INSERT TO authenticated WITH CHECK (true);
```

Rate-limiting at the ingest endpoint, not at RLS — see §5.3.3.

#### 5.3.2 Client tracker — `lib/analytics/track.ts`

```ts
type EventInput = {
  event_type: "pageview" | "click" | "milestone";
  path?: string;
  raw_path?: string;
  element?: string;
  properties?: Record<string, unknown>;
};

class Tracker {
  private buffer: EventInput[] = [];
  private flushTimer: number | null = null;
  private session_id: string;
  private anonymous_id: string;

  init() {
    // Read/create session_id (sessionStorage) + anonymous_id (localStorage).
    // Hook Next.js router events for pageview tracking.
    // Install capture-phase click listener on document.
    // Install pagehide / beforeunload to flush.
  }

  track(event: EventInput) { /* push to buffer + schedule flush */ }
  trackPageview(path: string) { /* pushed automatically on route change */ }
  trackClick(target: HTMLElement) { /* automatic; resolves to a stable element label */ }

  private flush() {
    // POST to /api/analytics/ingest with the buffer
    // Use sendBeacon on pagehide for reliability
  }
}

export const tracker = new Tracker();

// Public: server-side milestone tracking
export async function trackMilestone(
  event: string,
  ctx: { userId?: string; properties?: Record<string, unknown> }
) {
  // Insert directly via supabase service-role client.
}
```

**Element label resolution** (for click events):
1. If element has `data-track="<name>"`, use `data-track:<name>`
2. Else if `<button>` or `[role=button]`, use `button:<text content first 60 chars>`
3. Else if `<a>`, use `a:<text or href>`
4. Else discard (don't log every div click)

**Privacy guards** (built into the tracker, not opt-in):
- Never log `<input>`, `<textarea>`, `<select>` values — only that they were focused/changed
- Strip `?` query strings from `path` (only the route shape is logged); raw `raw_path` keeps the query for the case where it's needed in admin debugging
- Patient IDs in URL (e.g., `/patients/[id]/consultation`) get normalized to `/patients/[id]/consultation` in the `path` field; raw URL goes in `raw_path` and is admin-visible
- Email/phone strings detected anywhere in `properties` (regex check) → hashed before insert

#### 5.3.3 Ingest endpoint — `app/api/analytics/ingest/route.ts`

POST. Receives `{ events: EventInput[] }` (max 100 per request). Adds `session_id`, `anonymous_id`, `user_id` (if authenticated), `ts` (server time, not client), `user_agent`, `ip_hash`. Inserts batch.

Rate limit: 60 requests/minute per IP. Implementation: simple in-memory map (or Upstash Redis if it gets traffic; in-memory is fine for alpha).

Anti-abuse:
- Reject events with `path` longer than 256 chars
- Reject `properties` JSONB larger than 4 KB
- Reject `event_type` not in allowlist
- Trim `element` to 120 chars

Returns 204 on success, 429 on rate-limit, 400 on schema violation. Tracker swallows all responses (don't break the app on analytics failure).

#### 5.3.4 Server-side milestone events

Server-side `trackMilestone(event, ctx)` is called from key code paths:

- `signup_completed` — after auth.users insert + larinova_doctors insert
- `invite_redeemed` — in `/api/invite/redeem` after RPC succeeds
- `onboarding_completed` — when `onboarding_completed` flips to `true`
- `consultation_started` — in consultation start endpoint
- `consultation_completed` — when SOAP note generated
- `prescription_generated`
- `helena_message_sent`
- `payment_succeeded` (from Razorpay webhook)
- `subscription_canceled`
- `tier_dropped_to_free` (when `current_period_end` passes — via daily Inngest job)

These are inserted with `event_type='milestone'`, `properties` carrying domain metadata.

#### 5.3.5 `/admin/analytics` dashboards

Three top-level views, each backed by a SQL aggregation:

**Timeseries:**
- Page views per day (last 30d)
- Unique users per day
- Milestone events stacked area chart (signup, redeem, consultation_started, ...)

**Top elements:**
- Last 7 days
- Group by `element`, count clicks
- Show as ranked list with bar visualization

**Funnels** (predefined for v1):
- Visit → Sign-up → Redeem → Onboarding completed → First consultation
- Each step shows count + drop-off %
- Click a step → see the users who dropped at that step

**Sessions:**
- List of recent sessions (last 24h)
- Per session: duration, # events, doctor (if logged in), last path
- Click → `/admin/analytics/sessions/[id]` shows the full event timeline:
  - One event per row
  - `ts` (relative to session start), `event_type`, `path`, `element`
  - This is your "session replay" alternative — the screenplay version

### 5.4 Issues system

#### 5.4.1 Database

Migration `20260426130000_create_issues.sql`:
```sql
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'wont_fix');
CREATE TYPE issue_priority AS ENUM ('low', 'normal', 'high');
CREATE TYPE issue_message_role AS ENUM ('doctor', 'admin');

CREATE TABLE larinova_issues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 140),
  body         TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  status       issue_status NOT NULL DEFAULT 'open',
  priority     issue_priority NOT NULL DEFAULT 'normal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX idx_issues_doctor ON larinova_issues (doctor_id, created_at DESC);
CREATE INDEX idx_issues_status ON larinova_issues (status, created_at DESC);

CREATE TABLE larinova_issue_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID NOT NULL REFERENCES larinova_issues(id) ON DELETE CASCADE,
  sender_role     issue_message_role NOT NULL,
  sender_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body            TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_issue_messages_issue ON larinova_issue_messages (issue_id, created_at);

ALTER TABLE larinova_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_issue_messages ENABLE ROW LEVEL SECURITY;

-- Doctors see only their own issues
CREATE POLICY issues_select_own ON larinova_issues FOR SELECT TO authenticated
  USING (doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY issues_insert_own ON larinova_issues FOR INSERT TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY issue_messages_select_own ON larinova_issue_messages FOR SELECT TO authenticated
  USING (issue_id IN (
    SELECT i.id FROM larinova_issues i
    JOIN larinova_doctors d ON d.id = i.doctor_id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY issue_messages_insert_own ON larinova_issue_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'doctor'
    AND sender_user_id = auth.uid()
    AND issue_id IN (
      SELECT i.id FROM larinova_issues i
      JOIN larinova_doctors d ON d.id = i.doctor_id
      WHERE d.user_id = auth.uid()
    )
  );

-- Admin reads/writes via service-role bypass; no policies needed.
```

#### 5.4.2 Doctor-facing routes

```
app/[locale]/(protected)/issues/page.tsx                — list of own issues
app/[locale]/(protected)/issues/new/page.tsx            — report new issue
app/[locale]/(protected)/issues/[id]/page.tsx           — issue + chat thread
```

API:
```
app/api/issues/list/route.ts        — GET own issues
app/api/issues/route.ts             — POST new issue (validates doctor ownership)
app/api/issues/[id]/route.ts        — GET own single issue
app/api/issues/[id]/messages/route.ts — POST new message (doctor side)
```

A small "Report an issue" button rendered in the doctor's app header (or in a footer, or under the avatar dropdown). On click → `/issues/new`.

#### 5.4.3 Admin-facing routes

```
app/[locale]/(admin)/admin/issues/page.tsx       — all issues
app/[locale]/(admin)/admin/issues/[id]/page.tsx  — issue + chat (admin side)
```

API (under `/api/admin/issues/`, gated by admin email check):
- `list` — GET all issues with filters
- `[id]` — GET single + PATCH status/priority
- `[id]/messages` — POST admin reply

#### 5.4.4 Chat thread UX

Per existing UI rules in `~/.claude/rules/ui-rules.md`:
- ChatGPT-style input at the bottom of the page (matches existing chat patterns in the codebase)
- User messages right-aligned, admin messages left-aligned (or vice versa — pick one and be consistent)
- Avatar: doctor's DiceBear by user_id; admin uses a distinct emerald "L" mark
- Status changes (open → in_progress → resolved) are admin-only, shown as inline system messages in the thread
- Polling on focus: when the doctor returns to the tab, refetch messages

#### 5.4.5 Email notification on file

In `POST /api/issues` after the insert, fire an email to `gabrielantony56@gmail.com`:
- Subject: `[Larinova alpha] Dr. <FirstName> filed: <IssueTitle>`
- Body: doctor name + email + issue title + first 500 chars of body + admin link to `/admin/issues/<id>`
- Sender: `larinova@contact.raxgbc.co.in` (existing FROM via Resend)

## 6. Data flow

### 6.1 New visitor first-touch

```
visitor lands on app.larinova.com
  → tracker init: anonymous_id created (localStorage), session_id created (sessionStorage)
  → pageview event POSTed to /api/analytics/ingest with anonymous_id, no user_id
visitor signs up
  → server-side trackMilestone('signup_completed', {userId})
  → on next pageview, tracker now sends user_id alongside anonymous_id
  → admin can later JOIN events on anonymous_id to see pre-signup history
```

### 6.2 Issue file → admin reply

```
doctor clicks "Report issue" → /issues/new
doctor submits → POST /api/issues
  → RLS-enforced insert via doctor's authed client
  → email sent to gabrielantony56@gmail.com
  → trackMilestone('issue_filed', {issueId, doctorId})
admin reads in /admin/issues/<id>, replies
  → POST /api/admin/issues/<id>/messages (service role insert with sender_role='admin')
  → trackMilestone('issue_admin_replied', {issueId})
doctor returns to app, opens /issues/<id>
  → polling fetch shows the new message
  → trackMilestone('issue_message_seen_by_doctor', {issueId, messageId})
```

### 6.3 Code generation flow

```
admin clicks "Generate 5 codes" with note "Pilot batch 2"
  → POST /api/admin/codes/generate { count: 5, note: "Pilot batch 2" }
  → server generates 5 unique codes, inserts batch, returns array
  → admin UI shows the 5 codes, copyable
  → trackMilestone('codes_generated', {count, note})
```

## 7. Migrations

Three new migrations:
- `20260426120000_create_analytics_events.sql`
- `20260426130000_create_issues.sql`
- (No new migration for admin auth — pure code-level allowlist)

Apply order: events first (independent), issues second (independent of events).

## 8. Privacy & compliance notes

- **Patient data (PHI) is never logged in events.** Tracker has hardcoded blocklists; server-side milestones log entity IDs only.
- **IP addresses are hashed.** SHA-256(ip + project_secret) — usable for "same visitor across sessions" linking, not reversible.
- **`larinova_events` retention:** no automatic pruning in v1. Add a 180-day pruning Inngest job in v2 if volume becomes a concern.
- **Doctor isolation on issues** is RLS-enforced. Even if the API has a bug, RLS prevents cross-doctor reads.
- **Admin access logging:** every admin route POST (codes/generate, issues PATCH, etc.) inserts a `milestone` event tagged `admin_action` with the action name. Read-only admin routes are not logged.

## 9. Phased delivery

**Phase A — Admin shell** (~3 hours):
1. `lib/admin.ts` allowlist
2. Middleware admin gate
3. `/admin` overview cards
4. `/admin/codes` (list + generate)
5. `/admin/doctors` (list + drilldown)
6. `/admin/surveys` (read + verify form is wired)
7. End-to-end smoke: log in as gabrielantony56@gmail.com, generate 3 codes, verify they appear in /admin/codes

**Phase B — Custom analytics** (~5 hours):
1. Migration: `larinova_events` table
2. Client `lib/analytics/track.ts`
3. `app/api/analytics/ingest/route.ts`
4. Server-side `trackMilestone` instrumentation in 8+ key paths
5. `/admin/analytics` dashboards (timeseries, top elements, funnel, sessions)
6. End-to-end smoke: navigate the app as a real doctor, verify events arrive, drill into the session

**Phase C — Issues system** (~4 hours):
1. Migration: `larinova_issues` + `larinova_issue_messages` + RLS policies
2. Doctor routes: `/issues`, `/issues/new`, `/issues/[id]`
3. Doctor APIs
4. Admin routes: `/admin/issues`, `/admin/issues/[id]`
5. Admin APIs
6. Email-on-file via Resend
7. Header "Report an issue" button
8. End-to-end smoke: file an issue as a doctor, verify email arrives, reply as admin, verify polling refresh on doctor side, verify cross-doctor isolation (Doctor A cannot read Doctor B's issue ID)

## 10. Definition of done

- All three subsystems deployed to production on `main` → `app.larinova.com`
- `gabrielantony56@gmail.com` can sign in and reach `/admin`; any other email gets 404
- Admin can generate invite codes via UI; redeemed codes show redemption details
- Survey responses table is populated by the landing site form (verified end-to-end with one fresh submission)
- Page views and click events flow into `larinova_events` (verified with a 5-minute browse session)
- At least one funnel renders correctly (visit → signup → redeem → onboarding → first consultation)
- A doctor can file an issue, receive a thread reply from admin, and never see another doctor's issue (RLS-tested)
- Email lands at `gabrielantony56@gmail.com` on every new issue
- Cross-doctor isolation verified by attempting to read another doctor's issue via direct API call (returns 404 / empty)
- All code lints + typechecks clean; production build passes; new Playwright specs (admin gate, code generation, analytics ingest, issue file + reply) green

## 11. Risks & open items

- **Performance of `larinova_events` ingest at scale.** Acceptable for alpha (5 doctors). At ~100 doctors with autocapture, expect ~5K events/day. Add a TTL job before that threshold.
- **Service role key reuse on admin endpoints.** Admin endpoints will bypass RLS via service role. Each admin endpoint must independently validate `isAdminEmail(user.email)` before any DB call. Audit every admin endpoint.
- **Survey form drift.** If the landing site's form schema changes post-build, `/admin/surveys` rendering may break. Add a snapshot test of the form payload as part of the Phase A end-to-end smoke.
- **Realtime in chat (issues).** Polling-on-focus is fine for alpha. If doctors complain about "had to refresh," upgrade to Supabase realtime subscriptions in v2.
