# Locale Split — India & Indonesia

**Date:** 2026-04-12
**Status:** Approved, ready for implementation planning
**Scope:** `app` + `landing` (both Next.js apps under `~/Documents/products/larinova/`)

---

## 1. Goal

Split Larinova into two fully region-authored experiences:

- `/in` — **India**, English (Indian English), Sarvam AI for transcription/translation, India-specific integrations (NMC, Razorpay, Indian medicine formulary), Indian imagery and authored content.
- `/id` — **Indonesia**, Bahasa Indonesia, Deepgram Nova-3 for transcription, Indonesia-specific integrations (KKI stub, BPOM formulary, Xendit deferred), Indonesian imagery and freshly authored Bahasa content.

Content is **fully replaced** per region, not machine-translated. Copy, images, videos, onboarding illustrations, doctor photos, clinical scenes — all authored per region.

Legacy Arabic locale (`ar`) from the old Kosyn/UAE pivot (deprecated, see `_archive/deprecated-kosyn/`) is **deleted**.

---

## 2. Non-Goals

- Third locale. Architecture supports extension but no scaffolding is added.
- Per-region feature flags. Same features in both regions; only content and integrations differ.
- Content management UI. All content edited as JSON files in git.
- Browser language detection. IP geo is the single source of truth for first-visit region selection, user switches via `RegionSwitcher`.
- Mobile patient app. Out of scope.
- Indonesia billing/payment integration. Deferred until first paying Indonesia customer (Tier 3).
- Native-speaker Bahasa translation review. V1 ships with a "beta translation" banner on `/id`.

---

## 3. Architecture

### 3.1 Locale model

- `Locale = 'in' | 'id'`
- `next-intl` is the library of record. Code uses `locale` terminology throughout, even though conceptually each locale = one region = one language.
- `routing.ts`: `locales: ['in', 'id']`, `defaultLocale: 'in'`, `localePrefix: 'always'`.
- Every user-facing page is prefixed: `/in/...` or `/id/...`.
- Root path `/` has no content — middleware 307-redirects based on geo detection.

### 3.2 Region detection

Middleware reads `x-vercel-ip-country` (Vercel) or `cf-ipcountry` (Cloudflare) via the existing `app/api/geo/route.ts` logic (already built — reuse the helper):

```
if country == 'ID' → redirect to /id
else               → redirect to /in
```

First-visit redirect sets a `larinova_locale` cookie (1-year expiry). Subsequent visits read the cookie; no re-detection.

For authenticated doctors, `larinova_doctors.locale` (renamed from `language`) is the source of truth and supersedes the cookie on login.

### 3.3 Region switcher

`components/layout/RegionSwitcher.tsx` — two-item dropdown in the nav (🇮🇳 India / 🇮🇩 Indonesia). On select:

1. Rewrites the current path `/in/foo` → `/id/foo`
2. Sets the `larinova_locale` cookie
3. If authenticated, updates `larinova_doctors.locale` via a small API route
4. Hard-navigates to the new URL

### 3.4 Content layer

**Strings** — next-intl standard:

- `app/messages/in.json` — authored English (copied from current `en.json` as starting point, adjusted for Indian English)
- `app/messages/id.json` — authored Bahasa Indonesia (fresh, not machine-translated)
- `landing/messages/in.json` — authored English for landing site
- `landing/messages/id.json` — authored Bahasa for landing site

Each file uses PascalCase top-level namespaces: `Nav`, `Onboarding`, `Onboarding.Step1`, `Consultation`, `Dashboard`, `Patients`, `Helena`, `Landing.Hero`, `Auth`, etc.

Access via `useTranslations('Namespace')` (client) or `getTranslations('Namespace')` (server).

**Rule:** zero hardcoded user-facing strings in JSX. Only debug logs, error codes, and developer comments may remain English in source.

**Assets** — co-located under `public/in/` and `public/id/` with identical filenames:

```
public/
  in/
    auth-doctor.jpg
    landing-hero.mp4
    onboarding/
      step1-motivation.jpg
      step2-specialty.jpg
      step3-demo.jpg
      step4-prescription.jpg
      step5-registration.jpg
  id/
    auth-doctor.jpg
    landing-hero.mp4
    onboarding/
      step1-motivation.jpg
      ... (same filenames, Indonesian imagery)
  shared/
    larinova-logo-light.png
    larinova-logo-dark.png
    larinova-icon.png
    helena.png
```

Resolved via a helper:

```typescript
// lib/locale-asset.ts
import { useLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';

export function useLocaleAsset() {
  const locale = useLocale();
  return (path: string) => `/${locale}/${path}`;
}

export async function getLocaleAsset(path: string) {
  const locale = await getLocale();
  return `/${locale}/${path}`;
}
```

### 3.5 Transcription provider abstraction

Two interfaces because India uses streaming (Sarvam) and Indonesia uses batch (Deepgram Nova-3):

```typescript
// lib/transcription/types.ts
export interface BatchTranscriptionProvider {
  mode: 'batch';
  name: 'deepgram';
  transcribe(audio: Blob, opts: TranscribeOptions): Promise<TranscriptionResult>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export interface StreamingTranscriptionProvider {
  mode: 'streaming';
  name: 'sarvam';
  getStreamingSession(opts: TranscribeOptions): Promise<{
    token: string; wsUrl: string; expiresAt: number;
  }>;
  finalize(segments: TranscriptSegment[]): Promise<TranscriptionResult>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export type TranscriptionProvider =
  | BatchTranscriptionProvider
  | StreamingTranscriptionProvider;
```

**Resolver:**

```typescript
// lib/transcription/index.ts
export function getTranscriptionProvider(locale: Locale): TranscriptionProvider {
  if (locale === 'in') return sarvamStreamingProvider;
  if (locale === 'id') return deepgramBatchProvider;
  throw new Error(`No transcription provider for locale: ${locale}`);
}
```

**UI dispatch:**

```tsx
const provider = getTranscriptionProvider(locale);
return provider.mode === 'streaming'
  ? <StreamingRecorder provider={provider} />   // India (Sarvam)
  : <BatchRecorder provider={provider} />;      // Indonesia (Deepgram)
```

**File migration:**

- `hooks/useSarvamSTT.ts` → wrapped into `lib/transcription/sarvam.ts` as `sarvamStreamingProvider`. Internals unchanged.
- `lib/transcription/deepgram.ts` — new, uses `@deepgram/sdk` prerecorded endpoint with `model: 'nova-3'`, `language: 'id'`, `diarize: true`, `keyterm: [...]` for medical terminology boost.
- `app/api/sarvam/ws-token/route.ts` → renamed to `app/api/consultation/streaming-session/route.ts`, dispatches via resolver.
- `app/api/sarvam/transcribe/route.ts`, `app/api/sarvam/translate/route.ts`, `app/api/sarvam/soap/route.ts` → deleted. Replaced by `app/api/consultation/transcribe/route.ts` and `app/api/consultation/translate/route.ts` using the resolver.
- `components/consultation/TranscriptionViewSarvam.tsx` → renamed to `TranscriptionViewStreaming.tsx`, India-only.
- `components/consultation/TranscriptionViewDeepgram.tsx` → updated to become `TranscriptionViewBatch.tsx`, Indonesia-only.
- Other TranscriptionView components (`Speechmatics`, `Whisper`) → deleted unless needed for dev-only `voice-ai-testing`.

Env: `DEEPGRAM_API_KEY` added to vault and `.env.local`. Existing `SARVAM_*` vars kept.

### 3.6 SOAP note generation (both locales via Claude Service)

Sarvam's SOAP endpoint is retired. Both locales generate SOAP notes by calling the internal Claude Service (`https://claude.fierypools.fun`) via the existing `lib/ai.ts` client.

**Flow:**

```
Transcript (locale-correct: English for India, Bahasa for Indonesia)
  → POST /api/consultations/[id]/soap-note
  → Claude Service /chat with locale-aware system prompt (streaming SSE)
  → SOAP note in source language
  → Stored in DB (soap_note text + soap_note_locale enum)
  → Streamed to UI
```

**Prompt module:**

```typescript
// lib/soap/prompts.ts
export function buildSoapPrompt(locale: Locale): string {
  const lang = locale === 'in' ? 'English (Indian English)' : 'Bahasa Indonesia';
  const formulary = locale === 'in' ? 'CDSCO' : 'BPOM';
  return `You are a medical scribe. Generate a SOAP note in ${lang}
from the consultation transcript. Use drug names from the ${formulary} formulary.
Format: Subjective / Objective / Assessment / Plan.`;
}
```

**DB:**

- `larinova_consultations.soap_note_locale TEXT CHECK (soap_note_locale IN ('in','id'))` — nullable, backfilled to `'in'` for existing rows with non-null `soap_note`.

### 3.7 Helena AI assistant (both locales)

`app/api/helena/chat/route.ts` reads the current locale via `getLocale()` from `next-intl/server` and injects a locale-aware system prompt:

```typescript
// lib/helena/prompts.ts
export function buildHelenaSystemPrompt(locale: Locale): string {
  const lang = locale === 'in' ? 'English' : 'Bahasa Indonesia';
  return `You are Helena, Larinova's medical assistant. Respond in ${lang}.
Be concise, clinical, and helpful...`;
}
```

Conversation history is locale-tagged in the DB — a conversation started in `/in` stays English even if the doctor later switches to `/id`. New conversations inherit the current URL locale.

### 3.8 India-specific integrations → Indonesia siblings

| India route | Purpose | Indonesia sibling | Status |
|---|---|---|---|
| `app/api/nmc/lookup` | NMC doctor registration lookup | `app/api/kki/lookup` | Stub — KKI has no public API confirmed yet. Sibling accepts registration number, stores as-is, returns `{verified: 'pending'}`. Async verification deferred. |
| `app/api/razorpay/create-subscription` | Razorpay subscription create | `app/api/xendit/create-subscription` | **DEFERRED (Tier 3).** Stub route exists but always returns 501. `RegionSwitcher` in Indonesia hides the billing page. |
| `app/api/razorpay/verify` | Razorpay payment verify | `app/api/xendit/verify` | Deferred. |
| `app/api/razorpay/webhook` | Razorpay webhook | `app/api/xendit/webhook` | Deferred. |
| `app/api/medicines/search` | Indian formulary search | `app/api/formulary/search` | Generic route that dispatches by locale. India → existing Indian DB, Indonesia → BPOM drug list (seed JSON for v1, proper DB later). |

**Locale dispatch pattern** — a single generic endpoint reads `getLocale()` and routes internally:

```typescript
// app/api/formulary/search/route.ts
export async function GET(req: Request) {
  const locale = await getLocale();
  const query = new URL(req.url).searchParams.get('q');
  if (locale === 'in') return searchCdsco(query);
  if (locale === 'id') return searchBpom(query);
}
```

### 3.9 Database migration

```sql
-- 1. Rename column on larinova_doctors
ALTER TABLE larinova_doctors RENAME COLUMN language TO locale;

-- 2. Backfill all existing rows to 'in'
UPDATE larinova_doctors
  SET locale = 'in'
  WHERE locale IS NULL OR locale NOT IN ('in', 'id');

-- 3. Constrain and require
ALTER TABLE larinova_doctors
  ADD CONSTRAINT larinova_doctors_locale_valid CHECK (locale IN ('in', 'id'));
ALTER TABLE larinova_doctors
  ALTER COLUMN locale SET NOT NULL;
ALTER TABLE larinova_doctors
  ALTER COLUMN locale SET DEFAULT 'in';

-- 4. Add soap_note_locale to consultations
ALTER TABLE larinova_consultations
  ADD COLUMN soap_note_locale TEXT
  CHECK (soap_note_locale IN ('in', 'id'));

UPDATE larinova_consultations
  SET soap_note_locale = 'in'
  WHERE soap_note IS NOT NULL;
```

Migration file: `supabase/migrations/20260412_locale_split.sql`. Rollback file alongside: `supabase/migrations/20260412_locale_split_rollback.sql`.

The team lead is authorized to run migrations directly (confirmed by user).

---

## 4. Feature Inventory

Complete enumeration of what must work in both locales.

### 4.1 Auth surface
- `/[locale]/(auth)/sign-in` — email/phone + OTP entry
- `/[locale]/(auth)/sign-up` — doctor registration
- `/[locale]/(auth)/verify-otp` — OTP verification
- `/[locale]/auth/callback` — Supabase OAuth return
- Auth hero asset: `public/{locale}/auth-doctor.jpg`
- Email templates (signup confirmation, OTP email) — localized via `messages/{locale}.json` under `Auth.Emails`

### 4.2 Onboarding wizard — 7 steps
Located in `components/onboarding/`:
1. `StepMotivation` — pain points, asset `{locale}/onboarding/step1-motivation.jpg`
2. `StepSpecialty` — specialty picker, asset `{locale}/onboarding/step2-specialty.jpg`
3. `StepMagic` — product demo (contains a Sarvam/Deepgram live demo), asset `{locale}/onboarding/step3-demo.jpg`
4. `StepPrescription` — prescription preview, asset `{locale}/onboarding/step4-prescription.jpg`
5. `StepRegistration` — NMC lookup (India) or KKI manual entry (Indonesia), asset `{locale}/onboarding/step5-registration.jpg`
6. `StepProfile` — profile completion
7. `StepCelebration` — success animation
- Plus visual helpers: `ParticleDust`, `StepTransitionBurst`, `ProgressBar`

### 4.3 Dashboard
- `/[locale]/(protected)/page.tsx` — home with stats, tasks, recent consultations, Helena chat bar
- `components/dashboard/StatCard.tsx` — stat display
- `components/chat/ExpandableChatBar.tsx`, `HelenaInlineChat.tsx` — Helena

### 4.4 Patients module
- `/[locale]/(protected)/patients` — list + `SearchBar`
- `/[locale]/(protected)/patients/new` — create
- `/[locale]/(protected)/patients/[id]` — detail with tabs: `ConsultationsView`, `HealthRecordsView`, `InsuranceView`, `PrescriptionsView`
- `/[locale]/(protected)/patients/[id]/consultation` — live consultation flow

### 4.5 Consultations module
- `/[locale]/(protected)/consultations` — list
- `/[locale]/(protected)/consultations/[id]/summary` — SOAP note
- `/[locale]/(protected)/consultations/[id]/prescription` — prescription view
- Components: `ConsultationNotes`, `ConsultationResults`, `MedicalCodesView`, `PrescriptionForm`, `PrescriptionPreview`, `LanguageSelector`, `TranscriptionViewStreaming` (India), `TranscriptionViewBatch` (Indonesia)

### 4.6 Tasks
- `/[locale]/(protected)/tasks` — task list

### 4.7 Documents
- `/[locale]/(protected)/documents` — list
- `/[locale]/(protected)/documents/[id]` — detail

### 4.8 Settings
- `/[locale]/(protected)/settings/billing` — Razorpay for India. Page is hidden from `/id` nav until Xendit ships (Tier 3).

### 4.9 Helena AI assistant (sitewide)
- Chat widget in all protected pages
- API routes: `helena/chat`, `helena/conversations`, `helena/conversations/[id]/messages`, `helena/test`
- System prompt locale-aware (see §3.7)

### 4.10 Dev-only (not localized)
- `voice-ai-testing` — internal QA tool
- `test` — Sarvam playground
- These remain English. No `id.json` keys needed.

### 4.11 Landing site (separate repo `landing/`)
- Hero section with `landing-hero.mp4` — locale-specific video
- Feature showcase — locale-specific copy
- Testimonials — locale-specific photos and quotes
- Pricing — India shows INR (Razorpay), Indonesia shows "Coming soon"
- Footer — locale-specific contact/legal

---

## 5. Tier Prioritization

### Tier 1 — Must work perfectly (blocks launch)
1. Locale routing `/in` + `/id` with geo redirect and switcher
2. Auth flow (sign-in, sign-up, verify-otp) in both locales
3. Onboarding wizard — all 7 steps, both locales, region-correct imagery, KKI manual entry for Indonesia
4. Dashboard home — stats, tasks, recent consultations, Helena
5. Patient create/list/detail
6. Consultation recording → transcription → SOAP note, both locales end-to-end
7. Claude Service SOAP generation, both locales
8. All hero, onboarding, and doctor imagery swapped per locale

### Tier 2 — Important, not demo-blocking
9. Prescriptions creation + preview with BPOM formulary for Indonesia
10. Medical codes view (ICD-10 global)
11. Documents module
12. Send summary to patient (localized email templates)
13. Helena fully bilingual
14. Tasks module localized
15. Landing site fully authored in both locales

### Tier 3 — Deferred
16. Billing & subscription for Indonesia (Xendit). Razorpay continues for India. Indonesia doctors see no billing UI until Tier 3 ships.

### Tier 4 — Dev-only, not localized
17. `voice-ai-testing`, `test` stay English

---

## 6. cmux-teams Execution Plan

Execution uses cmux-teams (per `~/.claude/rules/cmux-teams.md`). Team lead runs Opus, teammates run Sonnet.

### 6.1 Team composition

| Role | Name | Model | Responsibility |
|---|---|---|---|
| Lead | `lead` | Opus (main) | Orchestrate, present reports, run migration, final integration, deploy |
| 1 | `foundation` | Sonnet | Routing, middleware, geo, region switcher, DB migration, `ar` deletion, `en.json` → `in.json` rename, `public/in|id` scaffolding |
| 2 | `transcription` | Sonnet | Provider abstraction, Sarvam wrap, Deepgram batch, consultation API consolidation, two TranscriptionView components |
| 3 | `soap-helena` | Sonnet | SOAP via Claude Service for both locales, Helena locale-aware system prompts |
| 4 | `content-author` | Sonnet | Author `id.json` fresh (two apps), phase 1b does `.tsx` string extraction in both apps |
| 5 | `india-integrations` | Sonnet | NMC → KKI stub, Razorpay (preserve) + Xendit stubs (501 responses), medicines → generic formulary with locale dispatch, BPOM seed JSON |
| 6 | `assets-higgsfield` | Sonnet | Generate all Indonesian imagery via `higgsfield-ai` skill, migrate existing assets to `public/in/`, populate `public/id/` |

### 6.2 Phase 0 — Foundation (sequential, blocks everything)

Only `foundation` runs. Work items:

1. Delete `messages/ar.json` (both apps)
2. Rename `messages/en.json` → `messages/in.json` (both apps)
3. Update `src/i18n/routing.ts`: `locales: ['in', 'id']`, default `'in'`
4. Create empty `messages/id.json` with same namespace scaffold (all values empty strings)
5. DB migration applied to staging (team lead runs this directly)
6. Update `middleware.ts`: all `doctorData.language` → `doctorData.locale`, add root-path geo redirect
7. Build `components/layout/RegionSwitcher.tsx`, mount in nav layout
8. Build `lib/locale-asset.ts` with `useLocaleAsset()` and `getLocaleAsset()`
9. `mkdir -p public/in public/id`, copy every current `public/*.{jpg,png,mp4,svg}` into `public/in/` (except `shared/` items: logos, icons, helena.png)
10. `public/id/` seeded with placeholder copies of `public/in/` so Indonesia routes render without broken assets
11. Full type check + build both apps
12. Manual smoke test: India still functional on `/in`
13. Commit, push, report to lead

**Lead gates on user confirmation before Phase 1a.**

### 6.3 Phase 1a — Four teammates in parallel

Teammates 2, 3, 5, 6 launch simultaneously via `cmux new-surface`. Phase 1a file ownership:

| Teammate | Owns | Must not touch |
|---|---|---|
| `transcription` | `lib/sarvam/*`, `lib/transcription/*` (new), `hooks/useSarvamSTT.ts`, `app/api/sarvam/*`, `app/api/consultation/transcribe/*`, `app/api/consultation/streaming-session/*`, `app/api/consultation/translate/*`, `components/consultation/TranscriptionView*.tsx` | Everything else |
| `soap-helena` | `app/api/consultations/[id]/soap-note/route.ts`, `app/api/helena/chat/route.ts`, `lib/soap/*` (new), `lib/helena/*` (prompts) | Transcription code, components, messages |
| `india-integrations` | `app/api/nmc/*`, `app/api/kki/*` (new), `app/api/razorpay/*`, `app/api/xendit/*` (new stubs), `app/api/medicines/*`, `app/api/formulary/*` (new), `lib/integrations/*`, `lib/formulary/bpom.json` (seed) | Transcription, SOAP, Helena, components, messages |
| `assets-higgsfield` | `public/in/*`, `public/id/*`, `docs/superpowers/assets/indonesia-prompts.md` (new) | All code files |

`content-author` ALSO runs in Phase 1a but **only touches `messages/id.json`** (Bahasa authoring). No `.tsx` edits. File ownership for Phase 1a:

| `content-author` | `app/messages/id.json`, `landing/messages/id.json` |

### 6.4 Phase 1b — Content extraction (serialized)

After Phase 1a finishes, `content-author` does a single pass across both apps to:
1. Find every hardcoded user-facing string in JSX across all component files
2. Replace with `useTranslations('Namespace')` calls
3. Add the corresponding key to both `in.json` and `id.json`
4. Run the build and fix any type errors

Why serialized: editing `.tsx` concurrently with other teammates risks merge conflicts. Phase 1b happens when other teammates are done.

### 6.5 Phase 2 — Integration, verification, deploy

Lead runs:

1. Pull all teammate branches, merge into main
2. Full build + type check for both `app` and `landing`
3. DB migration applied to staging
4. Manual smoke tests (exhaustive list in §6.7)
5. Playwright smoke tests scripted for: region switcher, both onboarding flows, both consultation flows, both auth flows
6. Grep for residual `ar` references: `grep -r "messages/ar" .`, `grep -r "'ar'" src/`
7. Grep for hardcoded English in JSX: spot-check top 10 components
8. Deploy to production

### 6.6 Communication loop

Per `cmux-teams.md`:

- Teammates only message lead on completion or blocking question
- Completion format: `[TEAMMATE:<name>] Complete. Files touched: N. Tests passing: Y/N. Manual smoke: <what>. Ready for integration.`
- Blocking-question format: `[QUESTION:<name>] <question>`
- Lead presents blocking questions to user, relays answers
- Lead does NOT micromanage — teammates own their scope
- User messages (no prefix) always take priority over `[LEAD]:` messages

### 6.7 Phase 2 verification checklist

- [ ] Visit `/` with no cookie, fake `x-vercel-ip-country: IN` → redirects to `/in`, sets cookie
- [ ] Visit `/` with no cookie, fake `x-vercel-ip-country: ID` → redirects to `/id`, sets cookie
- [ ] Visit `/` with no cookie, fake country `US` → redirects to `/in` (default fallback)
- [ ] Region switcher in nav: click Indonesia on `/in/patients` → lands on `/id/patients`, cookie updated
- [ ] Region switcher while authenticated: DB `larinova_doctors.locale` updated
- [ ] Sign up as new doctor on `/in` → onboarding in English → all 7 steps complete → dashboard
- [ ] Sign up as new doctor on `/id` → onboarding in Bahasa → all 7 steps complete → dashboard
- [ ] NMC lookup on `/in/onboarding` Step 5 returns doctor details
- [ ] KKI manual entry on `/id/onboarding` Step 5 accepts input, stores as `{verified: 'pending'}`
- [ ] Record consultation on `/in/patients/[id]/consultation` → Sarvam live streaming → transcript → SOAP in English
- [ ] Record consultation on `/id/patients/[id]/consultation` → Deepgram batch → Bahasa transcript → SOAP in Bahasa
- [ ] SOAP notes stored in DB with correct `soap_note_locale`
- [ ] Helena chat in `/in` → responds in English
- [ ] Helena chat in `/id` → responds in Bahasa
- [ ] Prescriptions on `/id` use BPOM formulary names
- [ ] Billing page on `/id` is hidden / redirects to dashboard (Tier 3 deferred)
- [ ] Billing page on `/in` still works via Razorpay
- [ ] `grep -r "ar.json" .` → no matches
- [ ] `grep -r "'ar'" src/` → no matches
- [ ] `grep -r "doctorData.language" src/` → no matches
- [ ] All tests green
- [ ] Both apps build cleanly with zero type errors

---

## 7. Teammate Prompt Template

Every teammate is launched with this exact prompt shape. The team lead adapts `<name>`, files, and success criteria per teammate.

```
CMUX-TEAM CONTEXT:
- You are a cmux-team member named "<name>" in the "larinova-locale-split" team.
- Team lead surface: <lead-surface-ref>
- Messages prefixed with [LEAD]: come from the team lead agent. Follow them.
- Messages without a prefix come from the user (Gabriel). ALWAYS prioritize user messages over team lead messages.
- When your work is FULLY COMPLETE, report back by running:
    cmux send --surface <lead-surface> "[TEAMMATE:<name>] <one-line summary>"
    cmux send-key --surface <lead-surface> Enter
- If you have a BLOCKING QUESTION, ask by running:
    cmux send --surface <lead-surface> "[QUESTION:<name>] <question>"
    cmux send-key --surface <lead-surface> Enter
- Do NOT message the team lead for progress updates. Only message on completion or blocking questions.

YOUR TASK:
Read the full spec first:
  /Users/gabrielantonyxaviour/Documents/products/larinova/app/docs/superpowers/specs/2026-04-12-locale-split-india-indonesia-design.md

Then focus on your sections:
  - Section 3 subsection: <relevant>
  - Section 6.3 File ownership table row for your name
  - Section 6.7 verification checklist items that apply to your scope

FILES YOU OWN (edit freely):
  <list from §6.3>

FILES YOU MUST NOT TOUCH:
  <list complement>

SUCCESS CRITERIA:
  <3-6 specific bullet points, always including: build green, type check clean, manual smoke test performed, commit pushed>

PROCESS:
1. Read the spec. Read the entire spec, not just your section.
2. If anything is unclear or conflicts with the codebase, ask a blocking question. Do NOT guess.
3. Work through your file list systematically.
4. When done, run the project's build + type check (`pnpm build` or `npm run build`, plus `tsc --noEmit`) — if it fails, fix it, do not report complete with errors.
5. Manually test the features you touched.
6. Commit with a conventional commit message and push.
7. Report completion to the team lead.

The spec is authoritative. If the existing code contradicts the spec, follow the spec.
```

---

## 8. Higgsfield Asset Generation Plan

Handled by `assets-higgsfield` teammate via the `higgsfield-ai` skill.

### 8.1 Assets to generate for Indonesia

**Onboarding (5 stills, `public/id/onboarding/`):**
1. `step1-motivation.jpg` — Indonesian doctor at desk, overwhelmed with paperwork stacks, natural daylight, modern clinic setting
2. `step2-specialty.jpg` — Indonesian doctor in specialty clinic (cardiology/pediatrics/GP rotation), stethoscope, clean white coat
3. `step3-demo.jpg` — Indonesian doctor holding a tablet displaying a medical app UI, pointing at screen with approving expression
4. `step4-prescription.jpg` — Hands writing a prescription on Indonesian prescription pad, medication bottles in background
5. `step5-registration.jpg` — Indonesian doctor credentials, ID badge, medical certificate framed on desk

**Landing (1 video, `public/id/`):**
- `landing-hero.mp4` — 10-second looping clinical scene, Indonesian doctor interacting with patient in modern consultation room, natural ambient motion

**Auth hero (1 still, `public/id/`):**
- `auth-doctor.jpg` — same pose and framing as existing `public/auth-doctor.jpg`, Indonesian doctor, warm lighting

### 8.2 Style guide for consistency

- **Demographics:** Mix of Javanese, Sundanese, Balinese features reflecting real Indonesia demographic distribution
- **Wardrobe:** Clean white coats, stethoscopes, minimal accessories, modern not traditional
- **Settings:** Bright modern private clinics, subtle tropical light quality, no regional kitsch
- **Lighting:** Match existing Indian imagery — natural daylight, warm tones, shallow depth of field
- **Composition:** 1:1 match to existing India assets (pose, framing, crop) so the app feels unified across regions

### 8.3 Prompt persistence

All Higgsfield prompts used stored in `docs/superpowers/assets/indonesia-prompts.md` for reproducibility.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Bahasa content quality (no native-speaker review in v1) | `/id` ships with a "beta translation" banner until a native review pass lands. Flag prominent on landing and onboarding. |
| Deepgram Nova-3 medical accuracy for Bahasa | `transcription` teammate runs a WER spike as first task: record 5 sample consultations, measure accuracy. If WER > 20%, escalate to lead for Azure Speech fallback decision. |
| KKI has no public API | Sibling route accepts manual entry, stores `{verified: 'pending'}`, async verification is a follow-up task. Documented in spec, not a blocker. |
| Xendit/Midtrans decision for Indonesia payments | Deferred to Tier 3. Indonesia billing UI hidden until then. |
| Sarvam refactor breaking India flow | `transcription` teammate success criterion #1: India must remain fully functional with zero UX regression. Manual smoke test required before reporting complete. |
| Parallel teammate merge conflicts | Strict file ownership per §6.3. `content-author` serialized to Phase 1b for `.tsx` edits. |
| Higgsfield generation latency (hours) | `assets-higgsfield` launches in Phase 1a and may extend into Phase 2. Placeholder assets keep builds passing. |
| Landing site scope creep | Landing localization is Tier 2, not Tier 1. If Tier 1 runs long, landing ships in a follow-up. |
| Legacy `ar` code references | Phase 2 verification includes grep pass for any residual `ar` references. |

---

## 10. Open Questions (none blocking)

All clarifying questions have been answered during brainstorming. Implementation can proceed immediately after user review of this spec.

---

## 11. References

- `~/.claude/rules/cmux-teams.md` — cmux-teams protocol
- `~/.claude/rules/claude-service.md` — Claude Service URL, auth, client
- `~/.claude/rules/ui-rules.md` — UI patterns (chat input, wallet, forms)
- `~/Documents/products/larinova/app/docs/superpowers/specs/2026-03-20-onboarding-redesign-design.md` — prior onboarding redesign spec (still relevant to Phase 1a content extraction)
- next-intl docs: https://next-intl-docs.vercel.app
- Deepgram Nova-3 docs: https://developers.deepgram.com/docs/nova-3
- Higgsfield AI skill: `higgsfield-ai` (Playwright MCP automation)

---

*End of spec. Ready for implementation planning via `writing-plans` skill.*
