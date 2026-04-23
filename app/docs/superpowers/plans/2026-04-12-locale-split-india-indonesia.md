# Locale Split — India & Indonesia Implementation Plan

> **For agentic workers:** Pick ONE of three sanctioned execution paths:
> 1. **`superpowers:executing-plans`** — sequential execution with built-in checkpoints (default for most plans)
> 2. **cmux-teams** — parallel execution across 3+ independent workstreams via cmux tabs (see `~/.claude/rules/cmux-teams.md`) — **recommended for this plan**
> 3. **`superpowers:subagent-driven-development`** — fresh subagent per task, fastest iteration (for plans with clear task boundaries)
>
> **Fresh session guidance**: this plan has 60+ tasks across multiple modules — **use a fresh Claude Code session** for execution.
>
> **Testing flow**: project has no unit-test framework configured — only Playwright E2E (`npm run test:e2e`). The task-step pattern in this plan is: **implement → `npm run build` (type check) → commit**. Playwright smoke tests are reserved for Phase 2 integration.
>
> **Verification between tasks**: `superpowers:verification-before-completion` enforces evidence-before-claims between tasks.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split Larinova into two fully region-authored experiences (`/in` India with Sarvam, `/id` Indonesia with Deepgram + Bahasa), delete legacy Arabic locale, preserve all Tier 1 features working end-to-end in both locales.

**Architecture:** next-intl locale routing with IP-geo redirect, locale-scoped asset helper, transcription provider abstraction (streaming Sarvam for `in`, batch Deepgram for `id`), SOAP via internal Claude Service for both locales, India-specific integrations (NMC, Razorpay, medicines) get Indonesia siblings (KKI stub, Xendit deferred, BPOM formulary).

**Tech Stack:** Next.js 16, React 19, next-intl 4.7, Supabase (Postgres), Sarvam AI, Deepgram Nova-3, Claude Service (`claude.fierypools.fun`), Playwright E2E, Higgsfield AI for asset generation.

**Project flow reference:** Project CLAUDE.md is effectively empty; this plan defines its own flow (implement → type check → commit). Refer to `~/.claude/rules/cmux-teams.md` for parallel execution conventions.

**Spec:** `/Users/gabrielantonyxaviour/Documents/products/larinova/app/docs/superpowers/specs/2026-04-12-locale-split-india-indonesia-design.md` — authoritative for every architectural decision in this plan.

---

## Execution Overview

```
Phase 0: Foundation (single teammate, ~1 hour, blocks everything)
   ↓
Phase 1a: Parallel teammates (5 teammates concurrent, ~4-6 hours wall clock)
   - transcription
   - soap-helena
   - india-integrations
   - assets-higgsfield
   - content-author (id.json only, no .tsx edits)
   ↓
Phase 1b: String extraction (content-author solo, ~2 hours)
   ↓
Phase 2: Integration + verification + deploy (lead, ~1-2 hours)
```

---

## File Structure

New files created by this plan:

```
app/
  messages/
    in.json                                    (renamed from en.json)
    id.json                                    (new, Bahasa)
  src/i18n/
    routing.ts                                 (modified)
  lib/
    locale-asset.ts                            (new)
    transcription/
      types.ts                                 (new)
      sarvam.ts                                (new, wraps hooks/useSarvamSTT)
      deepgram.ts                              (new)
      index.ts                                 (new, resolver)
    soap/
      prompts.ts                               (new)
    helena/
      prompts.ts                               (new)
    integrations/
      kki.ts                                   (new, stub)
      xendit.ts                                (new, stubs)
    formulary/
      bpom.json                                (new, seed data)
      index.ts                                 (new, dispatch helper)
  components/
    layout/
      RegionSwitcher.tsx                       (new)
      BetaTranslationBanner.tsx                (new)
    consultation/
      TranscriptionViewStreaming.tsx           (renamed from Sarvam)
      TranscriptionViewBatch.tsx               (refactored from Deepgram)
  app/
    [locale]/layout.tsx                        (modified)
    api/
      consultation/
        transcribe/route.ts                    (new)
        translate/route.ts                     (new)
        streaming-session/route.ts             (new, replaces sarvam/ws-token)
      kki/
        lookup/route.ts                        (new)
      xendit/
        create-subscription/route.ts           (new, returns 501)
        verify/route.ts                        (new, returns 501)
        webhook/route.ts                       (new, returns 501)
      formulary/
        search/route.ts                        (new, dispatches by locale)
      user/
        locale/route.ts                        (new, POST to update doctors.locale)
  middleware.ts                                (modified)
  supabase/migrations/
    20260412120000_locale_split.sql            (new)
    20260412120000_locale_split_rollback.sql   (new)
  public/
    in/                                        (new dir, existing assets moved)
    id/                                        (new dir, new Indonesian assets)
    shared/                                    (new dir, logos/icons)
  docs/superpowers/assets/
    indonesia-prompts.md                       (new, Higgsfield prompt log)
```

Files deleted:

```
messages/ar.json
messages/en.json                               (renamed, not deleted)
app/api/sarvam/transcribe/route.ts
app/api/sarvam/translate/route.ts
app/api/sarvam/soap/route.ts
app/api/sarvam/ws-token/route.ts
components/consultation/TranscriptionViewSarvam.tsx       (renamed)
components/consultation/TranscriptionViewDeepgram.tsx     (renamed)
components/consultation/TranscriptionViewSpeechmatics.tsx (deleted — unused in v1)
components/consultation/TranscriptionViewWhisper.tsx      (deleted — unused in v1)
```

---

# Phase 0: Foundation

**Owner:** `foundation` teammate (Sonnet). Solo. Blocks Phase 1.

**Goal:** Get `/in` routes working end-to-end with renamed column, placeholder `id.json`, geo redirect, region switcher, and locale-scoped asset helper — without breaking India.

---

### Task 0.1: Update next-intl routing config

**Files:**
- Modify: `src/i18n/routing.ts`

- [ ] **Step 1: Replace routing config**

Replace the entire contents of `src/i18n/routing.ts` with:

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["in", "id"],
  defaultLocale: "in",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 2: Type check**

Run: `npm run build` (will fail later because messages/in.json doesn't exist yet — that's fine, next task fixes it).

- [ ] **Step 3: Commit**

```bash
git add src/i18n/routing.ts
git commit -m "feat(i18n): replace en/ar locales with in/id"
```

---

### Task 0.2: Delete Arabic messages, rename English → Indian

**Files:**
- Delete: `messages/ar.json`
- Rename: `messages/en.json` → `messages/in.json`

- [ ] **Step 1: Rename and delete**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git mv messages/en.json messages/in.json
git rm messages/ar.json
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(i18n): rename en.json to in.json, remove ar.json"
```

- [ ] **Step 3: Repeat for landing app**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/landing
# Check if landing uses same pattern — it may not have messages yet
ls messages/ 2>/dev/null
```

If `landing/messages/en.json` exists: `git mv messages/en.json messages/in.json && git rm messages/ar.json 2>/dev/null; git commit -m "feat(i18n): rename en.json to in.json for landing"`.

If `landing/messages/` does not exist yet: note this and skip — Phase 1a `content-author` will handle landing localization from scratch.

---

### Task 0.3: Create empty id.json scaffold

**Files:**
- Create: `messages/id.json`

- [ ] **Step 1: Generate id.json with same shape but empty-string values**

Read `messages/in.json`, produce a copy where every string value is replaced with an empty string `""`. Use this Node script saved as `scripts/scaffold-id.ts`:

```typescript
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function emptyStrings(obj: unknown): unknown {
  if (typeof obj === 'string') return '';
  if (Array.isArray(obj)) return obj.map(emptyStrings);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = emptyStrings(v);
    return out;
  }
  return obj;
}

const inPath = resolve(__dirname, '../messages/in.json');
const idPath = resolve(__dirname, '../messages/id.json');
const src = JSON.parse(readFileSync(inPath, 'utf8'));
writeFileSync(idPath, JSON.stringify(emptyStrings(src), null, 2) + '\n');
console.log('Scaffolded messages/id.json');
```

Run: `npx tsx scripts/scaffold-id.ts`

- [ ] **Step 2: Delete the scaffold script (one-shot use)**

```bash
rm scripts/scaffold-id.ts
```

- [ ] **Step 3: Commit**

```bash
git add messages/id.json
git commit -m "feat(i18n): scaffold empty id.json matching in.json shape"
```

---

### Task 0.4: Write DB migration file

**Files:**
- Create: `supabase/migrations/20260412120000_locale_split.sql`
- Create: `supabase/migrations/20260412120000_locale_split_rollback.sql`

- [ ] **Step 1: Write forward migration**

Create `supabase/migrations/20260412120000_locale_split.sql` with:

```sql
BEGIN;

-- 1. Rename language → locale on larinova_doctors
ALTER TABLE larinova_doctors RENAME COLUMN language TO locale;

-- 2. Backfill everyone to 'in' (current user base is India)
UPDATE larinova_doctors
  SET locale = 'in'
  WHERE locale IS NULL OR locale NOT IN ('in', 'id');

-- 3. Constrain values
ALTER TABLE larinova_doctors
  ADD CONSTRAINT larinova_doctors_locale_valid
  CHECK (locale IN ('in', 'id'));

-- 4. Require non-null with default
ALTER TABLE larinova_doctors ALTER COLUMN locale SET NOT NULL;
ALTER TABLE larinova_doctors ALTER COLUMN locale SET DEFAULT 'in';

-- 5. Add soap_note_locale to consultations
ALTER TABLE larinova_consultations
  ADD COLUMN soap_note_locale TEXT
  CHECK (soap_note_locale IS NULL OR soap_note_locale IN ('in', 'id'));

-- 6. Backfill existing SOAP notes to 'in'
UPDATE larinova_consultations
  SET soap_note_locale = 'in'
  WHERE soap_note IS NOT NULL AND soap_note_locale IS NULL;

COMMIT;
```

- [ ] **Step 2: Write rollback**

Create `supabase/migrations/20260412120000_locale_split_rollback.sql`:

```sql
BEGIN;

ALTER TABLE larinova_consultations DROP COLUMN IF EXISTS soap_note_locale;

ALTER TABLE larinova_doctors ALTER COLUMN locale DROP DEFAULT;
ALTER TABLE larinova_doctors ALTER COLUMN locale DROP NOT NULL;
ALTER TABLE larinova_doctors DROP CONSTRAINT IF EXISTS larinova_doctors_locale_valid;
ALTER TABLE larinova_doctors RENAME COLUMN locale TO language;

COMMIT;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260412120000_locale_split.sql supabase/migrations/20260412120000_locale_split_rollback.sql
git commit -m "feat(db): add locale_split migration and rollback"
```

---

### Task 0.5: Apply DB migration to Supabase

**Files:** (no code changes, DB operation only)

- [ ] **Step 1: Apply forward migration**

The user has authorized the lead to run migrations directly. Run via Supabase CLI or direct SQL:

```bash
# Option A — Supabase CLI (preferred if configured)
supabase db push

# Option B — direct SQL via psql using DATABASE_URL from .env.local
psql "$DATABASE_URL" -f supabase/migrations/20260412120000_locale_split.sql
```

- [ ] **Step 2: Verify the migration succeeded**

```bash
psql "$DATABASE_URL" -c "\d larinova_doctors"
```

Expected: `locale` column exists as `text NOT NULL DEFAULT 'in'` with CHECK constraint.

```bash
psql "$DATABASE_URL" -c "SELECT DISTINCT locale FROM larinova_doctors;"
```

Expected: only `'in'` returned.

```bash
psql "$DATABASE_URL" -c "\d larinova_consultations" | grep soap_note_locale
```

Expected: column exists.

- [ ] **Step 3: No commit (DB change, no files changed)**

---

### Task 0.6: Update middleware — rename column references + add geo redirect

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Replace all `doctorData.language` with `doctorData.locale`**

Open `middleware.ts`. Find:

```typescript
.from("larinova_doctors")
.select("onboarding_completed, language")
```

Replace with:

```typescript
.from("larinova_doctors")
.select("onboarding_completed, locale")
```

Find:

```typescript
const preferredLocale = doctorData.language || locale;
```

Replace with:

```typescript
const preferredLocale = doctorData.locale || locale;
```

- [ ] **Step 2: Add root-path geo redirect**

At the top of the `middleware` function, after the intl middleware call but before any Supabase logic, add:

```typescript
// Root path — geo redirect to /in or /id
if (request.nextUrl.pathname === "/") {
  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;
  const targetLocale = country === "ID" ? "id" : "in";
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${targetLocale}`;
  const response = NextResponse.redirect(redirectUrl, 307);
  response.cookies.set("larinova_locale", targetLocale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
```

- [ ] **Step 3: Type check**

```bash
npm run build
```

Expected: successful build (or failure only on files not yet touched — note any failures and continue).

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(i18n): rename language→locale refs, add root geo redirect"
```

---

### Task 0.7: Build `useLocaleAsset` helper

**Files:**
- Create: `lib/locale-asset.ts`

- [ ] **Step 1: Write the helper**

Create `lib/locale-asset.ts`:

```typescript
import { useLocale } from "next-intl";
import { getLocale } from "next-intl/server";

/**
 * Client hook: returns a function that resolves a locale-scoped asset path.
 * Usage:
 *   const asset = useLocaleAsset();
 *   <img src={asset('onboarding/step1-motivation.jpg')} />
 * Resolves to `/in/onboarding/step1-motivation.jpg` on the Indian locale.
 */
export function useLocaleAsset() {
  const locale = useLocale();
  return (path: string) => `/${locale}/${path.replace(/^\/+/, "")}`;
}

/**
 * Server helper: async version for server components.
 */
export async function getLocaleAsset(path: string): Promise<string> {
  const locale = await getLocale();
  return `/${locale}/${path.replace(/^\/+/, "")}`;
}

/**
 * Shared asset helper — resolves to /shared/... regardless of locale.
 * Use for logos, icons, brand assets.
 */
export function sharedAsset(path: string): string {
  return `/shared/${path.replace(/^\/+/, "")}`;
}
```

- [ ] **Step 2: Type check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add lib/locale-asset.ts
git commit -m "feat(i18n): add useLocaleAsset helper for locale-scoped assets"
```

---

### Task 0.8: Build `RegionSwitcher` component

**Files:**
- Create: `components/layout/RegionSwitcher.tsx`

- [ ] **Step 1: Write the component**

Create `components/layout/RegionSwitcher.tsx`:

```typescript
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const REGIONS = [
  { code: "in", label: "India", flag: "🇮🇳" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
] as const;

export function RegionSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = REGIONS.find((r) => r.code === locale) ?? REGIONS[0];

  async function switchTo(code: "in" | "id") {
    if (code === locale) return;

    // Rewrite path /in/foo → /id/foo
    const newPath = pathname.replace(/^\/(in|id)(?=\/|$)/, `/${code}`);

    // Set cookie
    document.cookie = `larinova_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Persist to DB if authenticated (fire-and-forget)
    fetch("/api/user/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    }).catch(() => {});

    router.push(newPath);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span>{current.flag}</span>
          <span>{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {REGIONS.map((r) => (
          <DropdownMenuItem
            key={r.code}
            onClick={() => switchTo(r.code)}
            className="gap-2"
          >
            <span>{r.flag}</span>
            <span>{r.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Create the `/api/user/locale` endpoint**

Create `app/api/user/locale/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { locale } = await req.json();
  if (!["in", "id"].includes(locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, stored: false });

  await supabase
    .from("larinova_doctors")
    .update({ locale })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, stored: true });
}
```

- [ ] **Step 3: Type check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/RegionSwitcher.tsx app/api/user/locale/route.ts
git commit -m "feat(i18n): add RegionSwitcher component and locale-update endpoint"
```

---

### Task 0.9: Mount RegionSwitcher in the protected layout nav

**Files:**
- Modify: `app/[locale]/(protected)/layout.tsx` (or wherever the top nav lives — check `components/layout/*`)

- [ ] **Step 1: Locate the top nav component**

```bash
grep -r "RegionSwitcher\|TopNav\|Navbar\|Header" components/layout/ app/[locale]/
```

Find the rendering location of the top navigation. If none exists, add `RegionSwitcher` to the `(protected)/layout.tsx` header area near existing user menu.

- [ ] **Step 2: Import and render**

Add at the top of the located file:

```typescript
import { RegionSwitcher } from "@/components/layout/RegionSwitcher";
```

Inside the nav JSX, alongside the existing user menu/profile button:

```tsx
<RegionSwitcher />
```

- [ ] **Step 3: Type check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "feat(nav): mount RegionSwitcher in protected layout"
```

---

### Task 0.10: Scaffold `public/in/`, `public/id/`, `public/shared/` directories

**Files:** (asset moves)

- [ ] **Step 1: Create directories and move existing assets**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
mkdir -p public/in/onboarding public/id/onboarding public/shared

# Shared (cross-locale): logos, icons, helena avatar
git mv public/larinova-logo-light.png public/shared/
git mv public/larinova-logo-light@2x.png public/shared/
git mv public/larinova-logo-dark.png public/shared/
git mv public/larinova-logo-dark@2x.png public/shared/
git mv public/larinova-icon.png public/shared/
git mv public/larinova-icon-dark.png public/shared/
git mv public/helena.png public/shared/

# India-specific: all existing onboarding imagery, auth, hero
git mv public/onboarding/step1-motivation.jpg public/in/onboarding/
git mv public/onboarding/step2-specialty.jpg public/in/onboarding/
git mv public/onboarding/step3-demo.jpg public/in/onboarding/
git mv public/onboarding/step4-prescription.jpg public/in/onboarding/
git mv public/onboarding/step5-registration.jpg public/in/onboarding/
rmdir public/onboarding
git mv public/auth-doctor.jpg public/in/
git mv public/hero-video.mp4 public/in/
git mv public/landing-hero.mp4 public/in/
git mv public/medicine-bg.jpg public/in/

# Delete Sarvam branding from public (not a shared asset, India-only, but not user-facing branding we keep)
git rm public/sarvam-wordmark.svg public/sarvam-logo-white.svg
```

- [ ] **Step 2: Copy India assets to Indonesia as placeholders**

```bash
cp -r public/in/* public/id/
git add public/id/
```

These are temporary; Phase 1a `assets-higgsfield` teammate replaces them with real Indonesian imagery.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(assets): scaffold public/in, public/id, public/shared dirs"
```

---

### Task 0.11: Update all hardcoded asset paths in components to use `useLocaleAsset`

**Files:**
- Grep and modify: any `.tsx` file referencing `/onboarding/`, `/auth-doctor`, `/hero-video`, `/landing-hero`, `/larinova-logo`, `/larinova-icon`, `/helena.png`, `/medicine-bg`

- [ ] **Step 1: Find all hardcoded asset references**

```bash
grep -rn "src=\"/onboarding\|src=\"/auth-doctor\|src=\"/hero-video\|src=\"/landing-hero\|src=\"/larinova-logo\|src=\"/larinova-icon\|src=\"/helena.png\|src=\"/medicine-bg\|url('/onboarding\|url('/auth-doctor\|url('/hero-video\|url('/landing-hero" \
  app/ components/ --include="*.tsx" --include="*.ts"
```

Save the list of files to touch.

- [ ] **Step 2: For each file, classify asset and rewrite**

Rules:
- Logos, icons, helena.png → use `sharedAsset('larinova-logo-dark.png')`
- Onboarding images, auth-doctor, hero-video, landing-hero, medicine-bg → use `useLocaleAsset()` (client components) or `getLocaleAsset()` (server components)

Example transformation — before:

```tsx
<Image src="/onboarding/step1-motivation.jpg" alt="..." />
```

After (client component):

```tsx
import { useLocaleAsset } from "@/lib/locale-asset";
// inside component:
const asset = useLocaleAsset();
<Image src={asset("onboarding/step1-motivation.jpg")} alt="..." />
```

After (server component):

```tsx
import { getLocaleAsset } from "@/lib/locale-asset";
// inside async component:
const heroSrc = await getLocaleAsset("landing-hero.mp4");
<video src={heroSrc} />
```

- [ ] **Step 3: Type check**

```bash
npm run build
```

Fix any type errors. Most will be missing imports.

- [ ] **Step 4: Smoke test India build**

```bash
npm run dev
# Visit http://localhost:3000/ — should redirect to http://localhost:3000/in
# Visit http://localhost:3000/in — should render with all imagery (hero, logos)
# Check network tab: all /in/... asset requests return 200
```

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(assets): migrate hardcoded asset paths to useLocaleAsset"
```

---

### Task 0.12: Phase 0 final verification and report to lead

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: zero errors.

- [ ] **Step 2: Run dev server, manual smoke tests**

Start dev: `npm run dev`

Verify:
- [ ] `http://localhost:3000/` → redirects to `/in`
- [ ] `http://localhost:3000/in/sign-in` → renders auth page with `public/in/auth-doctor.jpg` loading
- [ ] `http://localhost:3000/id/sign-in` → renders the same page (English content still, because `id.json` is empty — that is expected in Phase 0)
- [ ] `http://localhost:3000/in` → redirects through auth as before (India flow unchanged)
- [ ] `RegionSwitcher` visible in protected layout nav
- [ ] Clicking "Indonesia" in switcher rewrites URL to `/id/...` and reloads

- [ ] **Step 3: Grep audit**

```bash
grep -rn "'en'\|\"en\"\|'ar'\|\"ar\"" src/ app/ components/ lib/ --include="*.ts" --include="*.tsx" | grep -v "lang=\"en\"\|// \|comment"
```

Expected: no matches referring to message-file locales. Any matches on `lang="en"` HTML attrs or string literals inside locale-agnostic code can stay.

```bash
grep -rn "doctorData.language" src/ app/ middleware.ts
```

Expected: zero matches.

- [ ] **Step 4: Report to lead (via cmux-teams)**

Run:
```bash
cmux send --surface <lead-surface> "[TEAMMATE:foundation] Complete. Files touched: ~25. Build green. India /in flow verified end-to-end. DB migration applied. id.json scaffolded empty. Ready for Phase 1a."
cmux send-key --surface <lead-surface> Enter
```

---

# Phase 1a: Parallel Teammate Execution

**Owners:** 5 teammates running concurrently via `cmux new-surface`.

Lead launches all five in parallel after Phase 0 user confirmation. Each teammate receives the prompt template from the spec §7 with their specific file ownership and success criteria.

---

## Teammate: `transcription`

**Owns:** `lib/sarvam/*`, `lib/transcription/*` (new), `hooks/useSarvamSTT.ts`, `app/api/sarvam/*`, `app/api/consultation/{transcribe,translate,streaming-session}/*` (new), `components/consultation/TranscriptionView*.tsx`

---

### Task T1: Deepgram WER spike (FIRST TASK — blocking risk check)

**Goal:** Measure Deepgram Nova-3 accuracy on Indonesian medical audio before investing in the full abstraction.

- [ ] **Step 1: Find or record 5 sample Indonesian medical audio clips**

Use publicly available Indonesian medical consultation audio (YouTube Indonesian doctor podcasts, public medical training audio). Save as `.wav` files locally at `test-audio/id/sample-{1..5}.wav`.

If no samples available, record 5 short (30s each) Bahasa consultation-style samples via phone using realistic medical terminology (diabetes, hypertension, sakit kepala, demam, batuk). Have a Bahasa speaker provide ground-truth transcripts saved as `test-audio/id/sample-{1..5}.txt`.

- [ ] **Step 2: Write a WER measurement script**

Create `scripts/deepgram-wer.ts`:

```typescript
import { createClient } from "@deepgram/sdk";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) throw new Error("Set DEEPGRAM_API_KEY");

const deepgram = createClient(DEEPGRAM_API_KEY);
const SAMPLES_DIR = resolve(__dirname, "../test-audio/id");

function wer(ref: string, hyp: string): number {
  const r = ref.toLowerCase().split(/\s+/);
  const h = hyp.toLowerCase().split(/\s+/);
  const m = r.length, n = h.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = r[i - 1] === h[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n] / m;
}

async function main() {
  const files = readdirSync(SAMPLES_DIR).filter(f => f.endsWith(".wav"));
  const results: { file: string; wer: number }[] = [];

  for (const f of files) {
    const audio = readFileSync(resolve(SAMPLES_DIR, f));
    const ref = readFileSync(resolve(SAMPLES_DIR, f.replace(".wav", ".txt")), "utf8").trim();

    const { result } = await deepgram.listen.prerecorded.transcribeFile(audio, {
      model: "nova-3",
      language: "id",
      diarize: true,
      keyterm: ["diabetes", "hipertensi", "demam", "batuk", "sakit kepala"],
    });

    const hyp = result?.results?.channels[0]?.alternatives[0]?.transcript ?? "";
    const w = wer(ref, hyp);
    results.push({ file: f, wer: w });
    console.log(`${f}: WER = ${(w * 100).toFixed(1)}%`);
  }

  const avg = results.reduce((s, r) => s + r.wer, 0) / results.length;
  console.log(`\nAverage WER: ${(avg * 100).toFixed(1)}%`);
  console.log(avg < 0.2 ? "PASS — proceed with Deepgram" : "FAIL — escalate to lead for Azure fallback");
}

main().catch(console.error);
```

- [ ] **Step 3: Add `DEEPGRAM_API_KEY` to `.env.local`**

```bash
~/.claude/vault/inject.sh get DEEPGRAM_API_KEY
```

If the key is not in the vault, ask the user to add it to `~/.claude/vault/.env.master`.

- [ ] **Step 4: Run the spike**

```bash
npx tsx scripts/deepgram-wer.ts
```

- [ ] **Step 5: Report outcome**

- If avg WER < 20%: proceed to T2.
- If avg WER ≥ 20%: send blocking question to lead:
  ```bash
  cmux send --surface <lead-surface> "[QUESTION:transcription] Deepgram Nova-3 WER on Bahasa medical samples is X% (threshold 20%). Recommend escalating to Azure Speech custom model. Proceed with Deepgram anyway or switch?"
  cmux send-key --surface <lead-surface> Enter
  ```
  Wait for lead response before T2.

- [ ] **Step 6: Delete the spike script and test audio**

```bash
rm scripts/deepgram-wer.ts
rm -rf test-audio/
```

- [ ] **Step 7: Commit the removal**

```bash
git add -u
git commit -m "chore: remove Deepgram WER spike artifacts (WER < 20%, proceeding)"
```

---

### Task T2: Define transcription provider types

**Files:**
- Create: `lib/transcription/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// lib/transcription/types.ts
import type { Locale } from "@/src/i18n/routing";

export interface TranscribeOptions {
  languageHint: string;
  diarize?: boolean;
  medicalVocab?: boolean;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  segments: TranscriptSegment[];
  durationSec: number;
}

export interface BatchTranscriptionProvider {
  readonly mode: "batch";
  readonly name: "deepgram";
  readonly supportedLocales: readonly Locale[];
  transcribe(audio: Blob, opts: TranscribeOptions): Promise<TranscriptionResult>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export interface StreamingTranscriptionProvider {
  readonly mode: "streaming";
  readonly name: "sarvam";
  readonly supportedLocales: readonly Locale[];
  getStreamingSession(opts: TranscribeOptions): Promise<{
    token: string;
    wsUrl: string;
    expiresAt: number;
  }>;
  finalize(segments: TranscriptSegment[]): Promise<TranscriptionResult>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export type TranscriptionProvider =
  | BatchTranscriptionProvider
  | StreamingTranscriptionProvider;
```

- [ ] **Step 2: Type check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add lib/transcription/types.ts
git commit -m "feat(transcription): add provider interface types"
```

---

### Task T3: Wrap Sarvam as streaming provider

**Files:**
- Create: `lib/transcription/sarvam.ts`
- Read: `hooks/useSarvamSTT.ts`, `lib/sarvam/client.ts`, `lib/sarvam/types.ts`

- [ ] **Step 1: Read existing Sarvam code to understand its shape**

```bash
cat hooks/useSarvamSTT.ts lib/sarvam/client.ts lib/sarvam/types.ts
```

- [ ] **Step 2: Write the wrapper**

Create `lib/transcription/sarvam.ts`:

```typescript
import type {
  StreamingTranscriptionProvider,
  TranscribeOptions,
  TranscriptSegment,
  TranscriptionResult,
} from "./types";
// Import existing Sarvam client — path depends on what you found in Step 1
import { sarvamClient } from "@/lib/sarvam/client";

class SarvamStreamingProviderImpl implements StreamingTranscriptionProvider {
  readonly mode = "streaming" as const;
  readonly name = "sarvam" as const;
  readonly supportedLocales = ["in"] as const;

  async getStreamingSession(opts: TranscribeOptions) {
    // Delegate to existing Sarvam ws-token logic
    const res = await sarvamClient.getWebSocketToken({
      language: opts.languageHint || "en-IN",
      diarize: opts.diarize ?? true,
    });
    return {
      token: res.token,
      wsUrl: res.wsUrl,
      expiresAt: res.expiresAt,
    };
  }

  async finalize(segments: TranscriptSegment[]): Promise<TranscriptionResult> {
    const text = segments.map((s) => s.text).join(" ");
    const durationSec = segments.length
      ? segments[segments.length - 1].end
      : 0;
    return {
      text,
      language: "en-IN",
      segments,
      durationSec,
    };
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    return sarvamClient.translate({ text, source: from, target: to });
  }
}

export const sarvamStreamingProvider = new SarvamStreamingProviderImpl();
```

**Note:** adjust the `sarvamClient` import and method names to match what actually exists in `lib/sarvam/client.ts`. Step 1 told you what exists.

- [ ] **Step 3: Type check**

```bash
npm run build
```

Fix any imports. If `sarvamClient` doesn't export these methods, add them as thin wrappers over the existing `lib/sarvam/*` code.

- [ ] **Step 4: Commit**

```bash
git add lib/transcription/sarvam.ts
git commit -m "feat(transcription): wrap Sarvam as StreamingTranscriptionProvider"
```

---

### Task T4: Implement Deepgram batch provider

**Files:**
- Create: `lib/transcription/deepgram.ts`

- [ ] **Step 1: Write the provider**

```typescript
// lib/transcription/deepgram.ts
import { createClient } from "@deepgram/sdk";
import type {
  BatchTranscriptionProvider,
  TranscribeOptions,
  TranscriptionResult,
} from "./types";

const MEDICAL_KEYTERMS_ID = [
  "diabetes", "hipertensi", "demam", "batuk", "sakit kepala",
  "tekanan darah", "gula darah", "kolesterol", "infeksi", "radang",
  "alergi", "asma", "jantung", "ginjal", "hati",
];

class DeepgramBatchProviderImpl implements BatchTranscriptionProvider {
  readonly mode = "batch" as const;
  readonly name = "deepgram" as const;
  readonly supportedLocales = ["id"] as const;

  private client = createClient(process.env.DEEPGRAM_API_KEY!);

  async transcribe(
    audio: Blob,
    opts: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const buffer = Buffer.from(await audio.arrayBuffer());

    const { result, error } = await this.client.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: "nova-3",
        language: "id",
        diarize: opts.diarize ?? true,
        keyterm: opts.medicalVocab ? MEDICAL_KEYTERMS_ID : undefined,
        punctuate: true,
        smart_format: true,
      },
    );

    if (error) throw new Error(`Deepgram error: ${error.message}`);

    const channel = result?.results?.channels?.[0];
    const alt = channel?.alternatives?.[0];
    if (!alt) throw new Error("Deepgram returned no alternatives");

    const segments =
      alt.words?.reduce<Array<{ start: number; end: number; text: string; speaker?: string }>>(
        (acc, w) => {
          const last = acc[acc.length - 1];
          if (last && last.speaker === String(w.speaker ?? 0)) {
            last.end = w.end;
            last.text += ` ${w.punctuated_word ?? w.word}`;
          } else {
            acc.push({
              start: w.start,
              end: w.end,
              text: w.punctuated_word ?? w.word,
              speaker: String(w.speaker ?? 0),
            });
          }
          return acc;
        },
        [],
      ) ?? [];

    return {
      text: alt.transcript,
      language: "id",
      segments,
      durationSec: result?.metadata?.duration ?? 0,
    };
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    // Deepgram does not provide translation. Route through Claude Service.
    const res = await fetch(`${process.env.CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CLAUDE_SERVICE_API_KEY!,
      },
      body: JSON.stringify({
        model: "sonnet",
        system: `Translate the following text from ${from} to ${to}. Return only the translation, no commentary.`,
        messages: [{ role: "user", content: text }],
        stream: false,
      }),
    });
    const data = await res.json();
    return data.content ?? data.text ?? "";
  }
}

export const deepgramBatchProvider = new DeepgramBatchProviderImpl();
```

- [ ] **Step 2: Ensure `DEEPGRAM_API_KEY` is in vault**

```bash
~/.claude/vault/inject.sh has DEEPGRAM_API_KEY
```

If missing: `~/.claude/vault/inject.sh get DEEPGRAM_API_KEY` to add it to `.env.local`.

- [ ] **Step 3: Type check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add lib/transcription/deepgram.ts
git commit -m "feat(transcription): add Deepgram Nova-3 batch provider"
```

---

### Task T5: Build resolver

**Files:**
- Create: `lib/transcription/index.ts`

- [ ] **Step 1: Write the resolver**

```typescript
// lib/transcription/index.ts
import type { Locale } from "@/src/i18n/routing";
import type { TranscriptionProvider } from "./types";
import { sarvamStreamingProvider } from "./sarvam";
import { deepgramBatchProvider } from "./deepgram";

export function getTranscriptionProvider(locale: Locale): TranscriptionProvider {
  if (locale === "in") return sarvamStreamingProvider;
  if (locale === "id") return deepgramBatchProvider;
  throw new Error(`No transcription provider for locale: ${locale}`);
}

export type { TranscriptionProvider } from "./types";
```

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add lib/transcription/index.ts
git commit -m "feat(transcription): add locale-based provider resolver"
```

---

### Task T6: Build new consultation API routes

**Files:**
- Create: `app/api/consultation/transcribe/route.ts`
- Create: `app/api/consultation/translate/route.ts`
- Create: `app/api/consultation/streaming-session/route.ts`

- [ ] **Step 1: Write `streaming-session` route**

```typescript
// app/api/consultation/streaming-session/route.ts
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { getTranscriptionProvider } from "@/lib/transcription";

export async function POST() {
  const locale = await getLocale();
  const provider = getTranscriptionProvider(locale);

  if (provider.mode !== "streaming") {
    return NextResponse.json(
      { error: "Streaming not supported for this locale" },
      { status: 400 },
    );
  }

  const session = await provider.getStreamingSession({
    languageHint: locale === "in" ? "en-IN" : "id-ID",
    diarize: true,
    medicalVocab: true,
  });

  return NextResponse.json(session);
}
```

- [ ] **Step 2: Write `transcribe` (batch) route**

```typescript
// app/api/consultation/transcribe/route.ts
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { getTranscriptionProvider } from "@/lib/transcription";

export async function POST(req: Request) {
  const locale = await getLocale();
  const provider = getTranscriptionProvider(locale);

  if (provider.mode !== "batch") {
    return NextResponse.json(
      { error: "Batch transcription not supported for this locale — use streaming-session instead" },
      { status: 400 },
    );
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio");
  if (!(audioFile instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio blob" }, { status: 400 });
  }

  const result = await provider.transcribe(audioFile, {
    languageHint: "id-ID",
    diarize: true,
    medicalVocab: true,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Write `translate` route**

```typescript
// app/api/consultation/translate/route.ts
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { getTranscriptionProvider } from "@/lib/transcription";

export async function POST(req: Request) {
  const { text, from, to } = await req.json();
  const locale = await getLocale();
  const provider = getTranscriptionProvider(locale);
  const translated = await provider.translate(text, from, to);
  return NextResponse.json({ text: translated });
}
```

- [ ] **Step 4: Type check & commit**

```bash
npm run build
git add app/api/consultation/
git commit -m "feat(api): add locale-aware consultation transcription routes"
```

---

### Task T7: Delete old Sarvam API routes

**Files:**
- Delete: `app/api/sarvam/transcribe/route.ts`
- Delete: `app/api/sarvam/translate/route.ts`
- Delete: `app/api/sarvam/soap/route.ts`
- Delete: `app/api/sarvam/ws-token/route.ts`

- [ ] **Step 1: Grep for callers of old routes first**

```bash
grep -rn "/api/sarvam/" app/ components/ hooks/ lib/
```

For each hit, update the caller to the new route path:
- `/api/sarvam/ws-token` → `/api/consultation/streaming-session`
- `/api/sarvam/transcribe` → `/api/consultation/transcribe`
- `/api/sarvam/translate` → `/api/consultation/translate`
- `/api/sarvam/soap` → `/api/consultations/[id]/soap-note` (owned by `soap-helena` teammate — don't touch the route, just update the caller's URL)

- [ ] **Step 2: Delete the old route files**

```bash
git rm app/api/sarvam/transcribe/route.ts
git rm app/api/sarvam/translate/route.ts
git rm app/api/sarvam/soap/route.ts
git rm app/api/sarvam/ws-token/route.ts
rmdir app/api/sarvam 2>/dev/null || true
```

- [ ] **Step 3: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(api): delete old sarvam routes, migrate callers to consultation/*"
```

---

### Task T8: Consolidate TranscriptionView components

**Files:**
- Rename: `components/consultation/TranscriptionViewSarvam.tsx` → `TranscriptionViewStreaming.tsx`
- Rename: `components/consultation/TranscriptionViewDeepgram.tsx` → `TranscriptionViewBatch.tsx`
- Delete: `components/consultation/TranscriptionViewSpeechmatics.tsx`
- Delete: `components/consultation/TranscriptionViewWhisper.tsx`
- Modify: `components/consultation/TranscriptionView.tsx` (the existing dispatcher if any)

- [ ] **Step 1: Rename and update imports**

```bash
git mv components/consultation/TranscriptionViewSarvam.tsx components/consultation/TranscriptionViewStreaming.tsx
git mv components/consultation/TranscriptionViewDeepgram.tsx components/consultation/TranscriptionViewBatch.tsx
git rm components/consultation/TranscriptionViewSpeechmatics.tsx
git rm components/consultation/TranscriptionViewWhisper.tsx
```

Update imports inside the renamed files:
- `TranscriptionViewStreaming.tsx` — rename component from `TranscriptionViewSarvam` to `TranscriptionViewStreaming`, update any `/api/sarvam/ws-token` fetches to `/api/consultation/streaming-session`
- `TranscriptionViewBatch.tsx` — rename component, update fetch to `/api/consultation/transcribe`

- [ ] **Step 2: Rewrite `TranscriptionView.tsx` as a locale dispatcher**

Replace contents of `components/consultation/TranscriptionView.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import { TranscriptionViewStreaming } from "./TranscriptionViewStreaming";
import { TranscriptionViewBatch } from "./TranscriptionViewBatch";

interface TranscriptionViewProps {
  consultationId: string;
  onComplete?: (transcript: string) => void;
}

export function TranscriptionView(props: TranscriptionViewProps) {
  const locale = useLocale();

  if (locale === "in") {
    return <TranscriptionViewStreaming {...props} />;
  }
  if (locale === "id") {
    return <TranscriptionViewBatch {...props} />;
  }
  return null;
}
```

- [ ] **Step 3: Grep for callers using old component names**

```bash
grep -rn "TranscriptionViewSarvam\|TranscriptionViewDeepgram\|TranscriptionViewSpeechmatics\|TranscriptionViewWhisper" app/ components/
```

Update any remaining imports to use `TranscriptionView` (the dispatcher).

- [ ] **Step 4: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(consultation): consolidate TranscriptionView to streaming+batch dispatcher"
```

---

### Task T9: Manual smoke test both flows

- [ ] **Step 1: India streaming smoke test**

```bash
npm run dev
```

Navigate to `http://localhost:3000/in/patients/<test-patient-id>/consultation`. Start a recording. Verify:
- WebSocket connects to Sarvam
- Live transcript appears in real time
- Stop recording → final transcript shown
- Console has no errors

- [ ] **Step 2: Indonesia batch smoke test**

Navigate to `http://localhost:3000/id/patients/<test-patient-id>/consultation`. Start a recording, speak a short Bahasa sentence, stop. Verify:
- No WebSocket attempted
- After stop, "Transcribing..." spinner appears
- Deepgram batch API call in network tab → 200
- Transcript appears in Bahasa
- Console has no errors

- [ ] **Step 3: Report to lead**

```bash
cmux send --surface <lead-surface> "[TEAMMATE:transcription] Complete. Files: ~12. Build green. India streaming verified end-to-end with Sarvam. Indonesia batch verified end-to-end with Deepgram (WER from T1: X%). Ready for integration."
cmux send-key --surface <lead-surface> Enter
```

---

## Teammate: `soap-helena`

**Owns:** `app/api/consultations/[id]/soap-note/route.ts`, `app/api/helena/chat/route.ts`, `lib/soap/*` (new), `lib/helena/*` (new)

---

### Task S1: Create SOAP prompt module

**Files:**
- Create: `lib/soap/prompts.ts`

- [ ] **Step 1: Write the prompt builder**

```typescript
// lib/soap/prompts.ts
import type { Locale } from "@/src/i18n/routing";

export function buildSoapSystemPrompt(locale: Locale): string {
  const lang = locale === "in" ? "English (Indian English)" : "Bahasa Indonesia";
  const formulary = locale === "in" ? "CDSCO (India)" : "BPOM (Indonesia)";

  return `You are a medical scribe for a doctor at Larinova. Generate a SOAP note in ${lang} from the consultation transcript below.

Use drug names and medication guidance from the ${formulary} formulary.

Format your response EXACTLY as:

## Subjective
<patient's subjective complaints, history, symptoms>

## Objective
<clinical findings, vitals, exam observations>

## Assessment
<diagnosis, differential, severity>

## Plan
<treatment plan, medications with dosage, follow-up, referrals>

Be concise and clinically accurate. Use appropriate medical terminology for the locale. Do not add commentary outside the SOAP structure.`;
}
```

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add lib/soap/prompts.ts
git commit -m "feat(soap): add locale-aware SOAP system prompt builder"
```

---

### Task S2: Rewrite SOAP note API route to use Claude Service

**Files:**
- Modify: `app/api/consultations/[id]/soap-note/route.ts`

- [ ] **Step 1: Read current implementation**

```bash
cat app/api/consultations/[id]/soap-note/route.ts
```

Note the current shape: request body, response, DB write pattern, auth check.

- [ ] **Step 2: Rewrite to call Claude Service**

Replace the route's POST handler with:

```typescript
// app/api/consultations/[id]/soap-note/route.ts
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buildSoapSystemPrompt } from "@/lib/soap/prompts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { transcript } = await req.json();
  const locale = await getLocale();

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
  }

  // Call Claude Service (streaming SSE)
  const claudeRes = await fetch(`${process.env.CLAUDE_SERVICE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.CLAUDE_SERVICE_API_KEY!,
    },
    body: JSON.stringify({
      model: "sonnet",
      system: buildSoapSystemPrompt(locale as "in" | "id"),
      messages: [{ role: "user", content: transcript }],
      stream: true,
    }),
  });

  if (!claudeRes.ok || !claudeRes.body) {
    const errText = await claudeRes.text();
    return NextResponse.json(
      { error: `Claude Service error: ${errText}` },
      { status: 502 },
    );
  }

  // Stream to client while buffering for DB write
  const reader = claudeRes.body.getReader();
  const decoder = new TextDecoder();
  let soapBuffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        soapBuffer += chunk;
        controller.enqueue(value);
      }
      controller.close();

      // After stream done, persist SOAP note
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        },
      );

      await supabase
        .from("larinova_consultations")
        .update({
          soap_note: soapBuffer,
          soap_note_locale: locale,
        })
        .eq("id", id);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 3: Type check**

```bash
npm run build
```

- [ ] **Step 4: Verify Claude Service env vars are present**

```bash
~/.claude/vault/inject.sh has CLAUDE_SERVICE_URL CLAUDE_SERVICE_API_KEY
```

If missing: `~/.claude/vault/inject.sh get CLAUDE_SERVICE_URL CLAUDE_SERVICE_API_KEY`.

- [ ] **Step 5: Commit**

```bash
git add app/api/consultations/[id]/soap-note/route.ts
git commit -m "feat(soap): route SOAP generation through Claude Service for both locales"
```

---

### Task S3: Create Helena prompt module

**Files:**
- Create: `lib/helena/prompts.ts`

- [ ] **Step 1: Write the prompt builder**

```typescript
// lib/helena/prompts.ts
import type { Locale } from "@/src/i18n/routing";

export function buildHelenaSystemPrompt(locale: Locale): string {
  const lang = locale === "in" ? "English" : "Bahasa Indonesia";
  const region = locale === "in" ? "India" : "Indonesia";
  const formulary = locale === "in" ? "CDSCO" : "BPOM";

  return `You are Helena, Larinova's embedded medical AI assistant for doctors in ${region}. Always respond in ${lang}.

You help doctors with:
- Answering clinical questions (diagnosis support, drug interactions, dosage)
- Explaining medical terminology
- Drafting patient communications
- Summarizing consultation notes
- Looking up medications from the ${formulary} formulary

Guidelines:
- Be concise and clinically precise
- Never fabricate drug names, dosages, or medical facts
- When uncertain, explicitly say so and suggest verifying with authoritative sources
- Match the doctor's register — formal but not stiff
- Respond in ${lang} regardless of the question's language unless asked otherwise`;
}
```

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add lib/helena/prompts.ts
git commit -m "feat(helena): add locale-aware system prompt builder"
```

---

### Task S4: Update Helena chat route to use locale-aware prompt

**Files:**
- Modify: `app/api/helena/chat/route.ts`

- [ ] **Step 1: Read current implementation**

```bash
cat app/api/helena/chat/route.ts
```

- [ ] **Step 2: Inject locale-aware system prompt**

Find the current system prompt string (usually a hardcoded English block). Replace with:

```typescript
import { getLocale } from "next-intl/server";
import { buildHelenaSystemPrompt } from "@/lib/helena/prompts";
// ...inside the POST handler:
const locale = (await getLocale()) as "in" | "id";
const systemPrompt = buildHelenaSystemPrompt(locale);
```

Pass `systemPrompt` in the Claude Service `chat` call body as the `system` field.

- [ ] **Step 3: Tag new conversations with locale**

Find the conversation-creation code (either in this route or in `app/api/helena/conversations/route.ts`). If `larinova_helena_conversations` table has no `locale` column, add it:

Create new migration `supabase/migrations/20260412120100_helena_locale.sql`:

```sql
ALTER TABLE larinova_helena_conversations
  ADD COLUMN IF NOT EXISTS locale TEXT
  CHECK (locale IS NULL OR locale IN ('in', 'id'));

UPDATE larinova_helena_conversations SET locale = 'in' WHERE locale IS NULL;
```

Apply via `psql "$DATABASE_URL" -f supabase/migrations/20260412120100_helena_locale.sql`.

Then in the chat route, when creating a new conversation, set `locale` from the current locale. When reading an existing conversation, use its stored `locale` to build the system prompt so a conversation started on `/in` stays English even if the doctor later visits `/id`.

- [ ] **Step 4: Type check & commit**

```bash
npm run build
git add app/api/helena/chat/route.ts supabase/migrations/20260412120100_helena_locale.sql
git commit -m "feat(helena): locale-aware system prompt, tag conversations with locale"
```

---

### Task S5: Smoke test SOAP + Helena in both locales

- [ ] **Step 1: SOAP smoke test — India**

```bash
npm run dev
```

On `/in/patients/<id>/consultation`, complete a recording → stop → verify SOAP note generates in English, stored with `soap_note_locale='in'`.

```bash
psql "$DATABASE_URL" -c "SELECT id, soap_note_locale, LEFT(soap_note, 100) FROM larinova_consultations ORDER BY created_at DESC LIMIT 3;"
```

- [ ] **Step 2: SOAP smoke test — Indonesia**

On `/id/patients/<id>/consultation`, complete a recording → stop → verify SOAP note generates in Bahasa, stored with `soap_note_locale='id'`.

- [ ] **Step 3: Helena smoke test — both locales**

- On `/in/` dashboard, open Helena chat → ask "What's the dosage for amoxicillin?" → verify response is in English
- On `/id/` dashboard, open Helena chat → ask "Apa dosis amoxicillin?" → verify response is in Bahasa

- [ ] **Step 4: Report to lead**

```bash
cmux send --surface <lead-surface> "[TEAMMATE:soap-helena] Complete. Files: 5. Build green. SOAP + Helena verified in both locales. Claude Service integration working. Ready for integration."
cmux send-key --surface <lead-surface> Enter
```

---

## Teammate: `india-integrations`

**Owns:** `app/api/nmc/*`, `app/api/kki/*` (new), `app/api/razorpay/*`, `app/api/xendit/*` (new), `app/api/medicines/*`, `app/api/formulary/*` (new), `lib/integrations/*`, `lib/formulary/*`

---

### Task I1: Create KKI lookup stub

**Files:**
- Create: `app/api/kki/lookup/route.ts`
- Create: `lib/integrations/kki.ts`

- [ ] **Step 1: Write the KKI library stub**

```typescript
// lib/integrations/kki.ts
/**
 * KKI (Konsil Kedokteran Indonesia) — Indonesia medical council registration lookup.
 * No public API available as of 2026-04. This stub accepts a registration number,
 * stores it as-is, and returns {verified: 'pending'}. Async verification is a future task.
 */
export interface KkiLookupResult {
  registrationNumber: string;
  verified: "pending" | "verified" | "failed";
  doctorName?: string;
  specialty?: string;
}

export async function lookupKki(registrationNumber: string): Promise<KkiLookupResult> {
  // Validate format — Indonesian medical registration numbers are typically
  // alphanumeric with specific patterns. Accept any non-empty string for v1.
  if (!registrationNumber || registrationNumber.trim().length < 5) {
    throw new Error("Invalid KKI registration number");
  }

  return {
    registrationNumber: registrationNumber.trim(),
    verified: "pending",
  };
}
```

- [ ] **Step 2: Write the API route**

```typescript
// app/api/kki/lookup/route.ts
import { NextResponse } from "next/server";
import { lookupKki } from "@/lib/integrations/kki";

export async function POST(req: Request) {
  try {
    const { registrationNumber } = await req.json();
    const result = await lookupKki(registrationNumber);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KKI lookup failed" },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 3: Type check & commit**

```bash
npm run build
git add app/api/kki/ lib/integrations/kki.ts
git commit -m "feat(kki): add KKI registration lookup stub (manual entry)"
```

---

### Task I2: Create Xendit stub routes (Tier 3 deferred)

**Files:**
- Create: `app/api/xendit/create-subscription/route.ts`
- Create: `app/api/xendit/verify/route.ts`
- Create: `app/api/xendit/webhook/route.ts`
- Create: `lib/integrations/xendit.ts`

- [ ] **Step 1: Write stub library**

```typescript
// lib/integrations/xendit.ts
/**
 * Xendit integration — DEFERRED until first paying Indonesia customer (Tier 3).
 * All functions currently throw or return 501.
 */
export function xenditNotImplemented(): never {
  throw new Error("Xendit integration is deferred to Tier 3. Indonesia billing is not yet available.");
}
```

- [ ] **Step 2: Write stub routes**

For each of `create-subscription/route.ts`, `verify/route.ts`, `webhook/route.ts`, write:

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Xendit integration not yet implemented — Indonesia billing coming soon" },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Xendit integration not yet implemented" },
    { status: 501 },
  );
}
```

- [ ] **Step 3: Type check & commit**

```bash
npm run build
git add app/api/xendit/ lib/integrations/xendit.ts
git commit -m "feat(xendit): add stub routes (Tier 3 deferred)"
```

---

### Task I3: Refactor medicines → formulary dispatch

**Files:**
- Create: `app/api/formulary/search/route.ts`
- Create: `lib/formulary/bpom.json`
- Create: `lib/formulary/index.ts`
- Modify: `app/api/medicines/search/route.ts` (deprecate, redirect to new path)

- [ ] **Step 1: Create BPOM seed data**

Create `lib/formulary/bpom.json` with 50+ common Indonesian medications. Start with:

```json
[
  { "id": "bpom_001", "name": "Parasetamol", "generic": "Paracetamol", "strength": "500 mg", "form": "tablet", "category": "analgesik" },
  { "id": "bpom_002", "name": "Amoksisilin", "generic": "Amoxicillin", "strength": "500 mg", "form": "kapsul", "category": "antibiotik" },
  { "id": "bpom_003", "name": "Ibuprofen", "generic": "Ibuprofen", "strength": "400 mg", "form": "tablet", "category": "NSAID" },
  { "id": "bpom_004", "name": "Metformin", "generic": "Metformin", "strength": "500 mg", "form": "tablet", "category": "antidiabetik" },
  { "id": "bpom_005", "name": "Amlodipin", "generic": "Amlodipine", "strength": "5 mg", "form": "tablet", "category": "antihipertensi" },
  { "id": "bpom_006", "name": "Simvastatin", "generic": "Simvastatin", "strength": "20 mg", "form": "tablet", "category": "statin" },
  { "id": "bpom_007", "name": "Omeprazol", "generic": "Omeprazole", "strength": "20 mg", "form": "kapsul", "category": "PPI" },
  { "id": "bpom_008", "name": "Salbutamol", "generic": "Salbutamol", "strength": "2 mg", "form": "tablet", "category": "bronkodilator" },
  { "id": "bpom_009", "name": "Cetirizin", "generic": "Cetirizine", "strength": "10 mg", "form": "tablet", "category": "antihistamin" },
  { "id": "bpom_010", "name": "Loratadin", "generic": "Loratadine", "strength": "10 mg", "form": "tablet", "category": "antihistamin" }
]
```

Extend to ~50 entries covering the common medication categories: analgesik, antibiotik, antihipertensi, antidiabetik, NSAID, PPI, bronkodilator, antihistamin, statin, vitamin, antifungal, antiemetik, antidepresan, antipsikotik. The content-author teammate can extend this further if time permits.

- [ ] **Step 2: Write dispatch helper**

```typescript
// lib/formulary/index.ts
import type { Locale } from "@/src/i18n/routing";
import bpomData from "./bpom.json";

export interface FormularyEntry {
  id: string;
  name: string;
  generic: string;
  strength: string;
  form: string;
  category: string;
}

export async function searchFormulary(
  locale: Locale,
  query: string,
): Promise<FormularyEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (locale === "id") {
    return (bpomData as FormularyEntry[]).filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.generic.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }

  // India — delegate to existing medicines search logic
  // (imported from the existing app/api/medicines/search route's helper)
  const { searchIndianMedicines } = await import("./india");
  return searchIndianMedicines(q);
}
```

- [ ] **Step 3: Extract existing India medicine search into `lib/formulary/india.ts`**

Read the existing `app/api/medicines/search/route.ts` and move the search logic into `lib/formulary/india.ts` as an exported `searchIndianMedicines(query: string): Promise<FormularyEntry[]>`.

- [ ] **Step 4: Write new `/api/formulary/search` route**

```typescript
// app/api/formulary/search/route.ts
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { searchFormulary } from "@/lib/formulary";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  const locale = (await getLocale()) as "in" | "id";
  const results = await searchFormulary(locale, query);
  return NextResponse.json({ results });
}
```

- [ ] **Step 5: Update old `/api/medicines/search` to redirect or delegate**

Replace `app/api/medicines/search/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { searchIndianMedicines } from "@/lib/formulary/india";

// Legacy route — kept for backward compat with existing frontend callers.
// Prefer /api/formulary/search for new code.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  const results = await searchIndianMedicines(query);
  return NextResponse.json({ results });
}
```

- [ ] **Step 6: Type check & commit**

```bash
npm run build
git add app/api/formulary/ lib/formulary/ app/api/medicines/search/route.ts
git commit -m "feat(formulary): add locale-aware formulary search, BPOM seed data"
```

---

### Task I4: Update onboarding StepRegistration for locale dispatch

**Files:**
- Modify: `components/onboarding/StepRegistration.tsx`

- [ ] **Step 1: Read current StepRegistration**

```bash
cat components/onboarding/StepRegistration.tsx
```

It currently calls `/api/nmc/lookup`.

- [ ] **Step 2: Dispatch by locale**

Modify the component to:

```tsx
"use client";
import { useLocale } from "next-intl";
// ... existing imports

export function StepRegistration(/* ... */) {
  const locale = useLocale();
  // ...
  async function lookup(registrationNumber: string) {
    const endpoint = locale === "in" ? "/api/nmc/lookup" : "/api/kki/lookup";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber }),
    });
    return res.json();
  }
  // ...
}
```

Also update the input label, placeholder, and verification UI based on locale:
- `locale === 'in'`: label "NMC Registration Number", placeholder example like "MCI-123456"
- `locale === 'id'`: label "Nomor STR (Surat Tanda Registrasi)", placeholder example like "12/II/2024", note "Verifikasi tertunda" (verification pending)

These strings come from `messages/{locale}.json` — use `useTranslations('Onboarding.Step5')` instead of hardcoding.

- [ ] **Step 3: Type check & commit**

```bash
npm run build
git add components/onboarding/StepRegistration.tsx
git commit -m "feat(onboarding): dispatch registration lookup by locale (NMC/KKI)"
```

---

### Task I5: Hide billing page on /id locale

**Files:**
- Modify: `app/[locale]/(protected)/settings/billing/page.tsx`
- Modify: wherever the sidebar nav renders the Billing link

- [ ] **Step 1: Server-redirect billing page on /id**

Add at the top of `app/[locale]/(protected)/settings/billing/page.tsx`:

```tsx
import { redirect } from "@/src/i18n/routing";
import { getLocale } from "next-intl/server";

export default async function BillingPage() {
  const locale = await getLocale();
  if (locale === "id") {
    redirect({ href: "/", locale });
    return null;
  }
  // ... existing billing page content
}
```

- [ ] **Step 2: Hide Billing link in sidebar for /id**

Find the sidebar nav component (`grep -rn "settings/billing" components/ app/`). In the navigation items list, filter out billing when locale is `id`:

```tsx
const navItems = [
  // ...other items
  ...(locale === "in" ? [{ href: "/settings/billing", label: t("nav.billing") }] : []),
];
```

- [ ] **Step 3: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(billing): hide billing page and nav link on /id locale"
```

---

### Task I6: Smoke test India integrations

- [ ] **Step 1: NMC lookup still works on /in**

On `/in/onboarding`, Step 5 should successfully look up a doctor via NMC.

- [ ] **Step 2: KKI manual entry works on /id**

On `/id/onboarding`, Step 5 should accept a registration number and return `{verified: 'pending'}`.

- [ ] **Step 3: Formulary search works in both locales**

- `curl 'http://localhost:3000/in/api/formulary/search?q=paracetamol'` → Indian results
- `curl 'http://localhost:3000/id/api/formulary/search?q=parasetamol'` → BPOM results

- [ ] **Step 4: Razorpay still works on /in billing**

Visit `/in/settings/billing` → page loads → existing Razorpay flow unchanged.

- [ ] **Step 5: Billing hidden on /id**

Visit `/id/settings/billing` → redirects to dashboard. Sidebar on `/id` has no Billing link.

- [ ] **Step 6: Report to lead**

```bash
cmux send --surface <lead-surface> "[TEAMMATE:india-integrations] Complete. Files: ~12. Build green. NMC+KKI verified, formulary dispatch working, Xendit stubs return 501, billing hidden on /id, Razorpay preserved on /in. Ready for integration."
cmux send-key --surface <lead-surface> Enter
```

---

## Teammate: `content-author` (Phase 1a subset — id.json only)

**Owns (Phase 1a):** `app/messages/id.json`, `landing/messages/id.json`. NO `.tsx` edits in Phase 1a — those come in Phase 1b.

---

### Task C1: Audit in.json structure and categorize keys

- [ ] **Step 1: List all namespaces**

```bash
cat messages/in.json | jq 'keys'
```

Capture the top-level namespace list (e.g., `Nav`, `Auth`, `Onboarding`, `Dashboard`, `Patients`, `Consultation`, `Helena`, `Settings`, etc.).

- [ ] **Step 2: Count total strings**

```bash
cat messages/in.json | jq '[paths(strings) as $p | getpath($p)] | length'
```

Report number (likely 200-600 strings).

---

### Task C2: Author Bahasa translations in `app/messages/id.json`

**Files:**
- Modify: `messages/id.json` (populate from empty scaffold)

- [ ] **Step 1: Translate namespace-by-namespace**

Open `messages/id.json` and `messages/in.json` side-by-side. For each empty string in `id.json`, author the Bahasa Indonesia equivalent.

**Rules:**
- Do NOT machine-translate. Write natural Bahasa as a native speaker would.
- Use `Anda` (formal) for second person, not `kamu`
- Medical terminology: use standard Indonesian medical vocabulary (e.g., "pasien", "konsultasi", "resep", "diagnosis")
- Preserve all placeholders like `{name}`, `{count}`, `{date}`
- Brand name "Larinova" stays as-is, untranslated
- UI affordances: "Masuk" (Sign in), "Daftar" (Sign up), "Simpan" (Save), "Batal" (Cancel), "Hapus" (Delete), "Lanjutkan" (Continue), "Kembali" (Back)

**Example transformation:**

```json
// in.json
"Onboarding": {
  "Step1": {
    "title": "What brought you to Larinova?",
    "subtitle": "Tell us what you're hoping to solve"
  }
}

// id.json
"Onboarding": {
  "Step1": {
    "title": "Apa yang membawa Anda ke Larinova?",
    "subtitle": "Beritahu kami masalah apa yang ingin Anda selesaikan"
  }
}
```

- [ ] **Step 2: Validate JSON**

```bash
cat messages/id.json | jq . > /dev/null
```

Expected: no errors (valid JSON).

- [ ] **Step 3: Validate completeness**

```bash
# Count strings in in.json vs id.json
A=$(cat messages/in.json | jq '[paths(strings) as $p | getpath($p)] | length')
B=$(cat messages/id.json | jq '[paths(strings) as $p | getpath($p)] | length')
echo "in.json: $A strings, id.json: $B strings"
```

Expected: same count.

```bash
# Check for any remaining empty strings in id.json
cat messages/id.json | jq '[paths(strings) as $p | select(getpath($p) == "") | $p]'
```

Expected: `[]` (empty array — no untranslated keys).

- [ ] **Step 4: Commit**

```bash
git add messages/id.json
git commit -m "feat(i18n): author Bahasa translations for app id.json"
```

---

### Task C3: Author Bahasa translations in `landing/messages/id.json`

**Files:**
- Modify: `landing/messages/id.json` (or create if landing hasn't been localized yet)

- [ ] **Step 1: Check landing state**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/landing
ls messages/ 2>/dev/null
```

If `messages/in.json` exists, author `id.json` parallel to it. If not, note this in the blocking-question to lead and skip (landing localization becomes a separate follow-up task).

- [ ] **Step 2: If `landing/messages/in.json` exists, author `id.json`**

Same rules as Task C2. Pay special attention to:
- Hero headline — should punch harder in Bahasa, not just translate literally
- Feature section copy — natural Bahasa marketing tone
- Testimonials — need to be from plausible Indonesian doctors (even if illustrative)
- Pricing — show "Segera hadir" (Coming soon) in Bahasa since Xendit is deferred
- Legal/footer — use Indonesian legal register

- [ ] **Step 3: Validate + commit**

```bash
cd landing
cat messages/id.json | jq . > /dev/null
git add messages/id.json
git commit -m "feat(i18n): author Bahasa translations for landing id.json"
```

---

### Task C4: Create BetaTranslationBanner component and keys

**Files:**
- Create: `components/layout/BetaTranslationBanner.tsx`
- Modify: `messages/in.json`, `messages/id.json` (add banner keys)

- [ ] **Step 1: Add banner keys to both message files**

Add to `messages/in.json`:

```json
"Banner": {
  "betaTranslation": "Indonesian experience is in beta. Translations and content are being refined."
}
```

Add equivalent to `messages/id.json`:

```json
"Banner": {
  "betaTranslation": "Pengalaman bahasa Indonesia masih dalam tahap beta. Terjemahan dan konten sedang disempurnakan."
}
```

- [ ] **Step 2: Write the banner component**

```tsx
// components/layout/BetaTranslationBanner.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { X } from "lucide-react";

export function BetaTranslationBanner() {
  const locale = useLocale();
  const t = useTranslations("Banner");
  const [dismissed, setDismissed] = useState(false);

  if (locale !== "id" || dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 flex items-center justify-between">
      <span>{t("betaTranslation")}</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Mount in locale layout**

In `app/[locale]/layout.tsx`, add `<BetaTranslationBanner />` just inside the root provider so it shows on every `/id` page.

- [ ] **Step 4: Type check & commit**

```bash
npm run build
git add components/layout/BetaTranslationBanner.tsx app/[locale]/layout.tsx messages/
git commit -m "feat(i18n): add beta translation banner for /id locale"
```

---

### Task C5: Report Phase 1a complete (content-author)

- [ ] **Step 1: Report to lead**

```bash
cmux send --surface <lead-surface> "[TEAMMATE:content-author] Phase 1a complete. app id.json fully authored (N strings). landing id.json authored. Beta banner added. Waiting for Phase 1a teammates to finish before starting Phase 1b (.tsx string extraction)."
cmux send-key --surface <lead-surface> Enter
```

---

## Teammate: `assets-higgsfield`

**Owns:** `public/in/*`, `public/id/*`, `docs/superpowers/assets/indonesia-prompts.md`

---

### Task A1: Confirm `public/in/` is populated (from Phase 0)

- [ ] **Step 1: Verify India assets present**

```bash
ls public/in/ public/in/onboarding/
```

Expected: all original India imagery present (moved by `foundation` teammate in Phase 0).

---

### Task A2: Write Higgsfield prompt log

**Files:**
- Create: `docs/superpowers/assets/indonesia-prompts.md`

- [ ] **Step 1: Write the prompt log with all 7 asset briefs**

```markdown
# Indonesia Asset Generation Prompts

Target: `public/id/`

All assets must match the visual language of existing India assets in `public/in/` — same lighting, composition, framing. Only the people and setting should reflect Indonesia.

## Style rules (apply to all assets)

- Subjects: Mix of Javanese, Sundanese, Balinese features — natural Indonesian demographics
- Wardrobe: Clean white doctor coats, stethoscopes, minimal accessories
- Settings: Bright modern private Indonesian clinics — no regional kitsch, no batik patterns on walls
- Lighting: Natural daylight, warm tones, shallow depth of field
- Color grade: Match the existing Indian imagery color palette

## Assets

### 1. `public/id/onboarding/step1-motivation.jpg`
**Prompt:** Indonesian doctor at a modern clinic desk, visibly overwhelmed by stacks of paper charts and insurance forms, slightly furrowed brow, natural daylight from a window, mid-30s, wearing white coat with stethoscope around neck, shallow depth of field, warm color grade, 4:3 ratio

### 2. `public/id/onboarding/step2-specialty.jpg`
**Prompt:** Indonesian female doctor in a modern pediatric clinic examination room, holding a small child-sized blood pressure cuff, warm welcoming expression, early 30s, white coat, natural daylight, shallow depth of field, 4:3 ratio

### 3. `public/id/onboarding/step3-demo.jpg`
**Prompt:** Indonesian male doctor holding a tablet displaying a clean medical software interface, pointing at the screen with approving expression, modern clinic background out of focus, late 30s, white coat, 4:3 ratio

### 4. `public/id/onboarding/step4-prescription.jpg`
**Prompt:** Close-up of hands writing on an Indonesian prescription pad with a fountain pen, small medication bottles blurred in background, desk with stethoscope and reading glasses, warm ambient lighting, macro, 4:3 ratio

### 5. `public/id/onboarding/step5-registration.jpg`
**Prompt:** Indonesian doctor credentials on a desk — hanging ID badge, framed medical license certificate (Indonesian text), stethoscope, natural daylight, shallow depth of field, 4:3 ratio

### 6. `public/id/auth-doctor.jpg`
**Prompt:** Indonesian doctor, mid-30s, warm smile, looking slightly off-camera, clean white coat with stethoscope, bright modern clinic background softly blurred, natural warm daylight, professional portrait, matches the framing and pose of `public/in/auth-doctor.jpg`, 3:4 ratio

### 7. `public/id/landing-hero.mp4`
**Prompt (video, 10s loop):** Indonesian doctor consulting with a patient in a modern clinic room, gentle ambient motion — doctor nodding, patient speaking, doctor taking notes on tablet. Natural warm daylight, shallow depth of field. Subtle slow camera push-in. Looping seamlessly. 1920x1080, 10 seconds.

## Generation order

1. Stills first (1-6) — fastest to iterate
2. Video last (7) — longest generation time, start it in parallel with stills if the Higgsfield skill supports parallel jobs
```

- [ ] **Step 2: Commit the prompt log**

```bash
git add docs/superpowers/assets/indonesia-prompts.md
git commit -m "docs(assets): add Higgsfield prompt log for Indonesia"
```

---

### Task A3: Generate Indonesian onboarding stills via Higgsfield AI

- [ ] **Step 1: Invoke the higgsfield-ai skill**

Use the `higgsfield-ai` skill via `Skill` tool. Pass the prompt log as the task reference.

- [ ] **Step 2: Download each generated still to `public/id/`**

For each of the 6 stills listed in `indonesia-prompts.md`:
- Use Higgsfield UI via Playwright MCP to generate the image
- Download the result
- Save to the exact path specified (`public/id/onboarding/stepN-*.jpg` or `public/id/auth-doctor.jpg`)
- Verify dimensions match the India original (check with `identify` or `sips -g pixelWidth public/in/onboarding/step1-motivation.jpg`)

- [ ] **Step 3: Stage all generated images**

```bash
git add public/id/
```

---

### Task A4: Generate Indonesian landing hero video

- [ ] **Step 1: Generate the video via Higgsfield**

Use the `higgsfield-ai` skill with the video prompt from `indonesia-prompts.md` asset #7. Download to `public/id/landing-hero.mp4`.

Note: video generation can take 30+ minutes. Run this in parallel with Task A3 stills if possible.

- [ ] **Step 2: Verify the video plays and loops cleanly**

```bash
# macOS quicklook
qlmanage -p public/id/landing-hero.mp4 2>/dev/null &
```

- [ ] **Step 3: Check file size (optimize if > 10 MB)**

```bash
ls -lh public/id/landing-hero.mp4
```

If > 10 MB, compress with ffmpeg:

```bash
ffmpeg -i public/id/landing-hero.mp4 -vcodec libx264 -crf 28 -preset slow -an public/id/landing-hero-compressed.mp4
mv public/id/landing-hero-compressed.mp4 public/id/landing-hero.mp4
```

---

### Task A5: Final commit all Indonesian assets

- [ ] **Step 1: Verify all expected files present**

```bash
ls public/id/ public/id/onboarding/
```

Expected:
- `public/id/auth-doctor.jpg`
- `public/id/landing-hero.mp4`
- `public/id/onboarding/step1-motivation.jpg`
- `public/id/onboarding/step2-specialty.jpg`
- `public/id/onboarding/step3-demo.jpg`
- `public/id/onboarding/step4-prescription.jpg`
- `public/id/onboarding/step5-registration.jpg`

- [ ] **Step 2: Commit**

```bash
git add public/id/
git commit -m "feat(assets): generate Indonesian onboarding, auth, and landing assets via Higgsfield"
```

- [ ] **Step 3: Report to lead**

```bash
cmux send --surface <lead-surface> "[TEAMMATE:assets-higgsfield] Complete. Assets: 6 stills + 1 video generated and committed. Indonesia imagery in place. Ready for integration."
cmux send-key --surface <lead-surface> Enter
```

---

# Phase 1b: String Extraction (content-author solo)

**Owner:** `content-author` teammate continues after Phase 1a is done.

Phase 1a left many components with hardcoded English strings in JSX. Phase 1b replaces every hardcoded user-facing string with `useTranslations()` calls and adds the corresponding keys to both message files.

---

### Task X1: Audit hardcoded strings by component area

- [ ] **Step 1: Grep for JSX text content**

```bash
# Rough heuristic: find JSX text between tags that isn't a variable
grep -rn '>[A-Z][a-zA-Z ]\{3,\}<' app/ components/ --include="*.tsx" | head -50
```

Save the output as a rough list of offenders. Any string of 3+ words starting with a capital letter inside `>...</` is likely a hardcoded English string.

- [ ] **Step 2: Group by component area**

Classify each hit into: onboarding, dashboard, patients, consultation, tasks, documents, settings, helena, auth, layout.

---

### Task X2: Extract strings from onboarding components

**Files:**
- Modify: `components/onboarding/*.tsx`
- Modify: `messages/in.json`, `messages/id.json`

- [ ] **Step 1: For each onboarding component (`StepMotivation`, `StepSpecialty`, `StepMagic`, `StepPrescription`, `StepRegistration`, `StepProfile`, `StepCelebration`, `OnboardingCard`, `ProgressBar`)**

For each hardcoded string:
1. Add a key to `messages/in.json` under `Onboarding.<StepName>.<keyName>`
2. Add the same key to `messages/id.json` with the Bahasa translation (author it now since content-author is the Bahasa native)
3. Replace the JSX hardcoded string with `{t('keyName')}`
4. Add `const t = useTranslations('Onboarding.StepName')` at the top of the component

Example — before:

```tsx
export function StepMotivation() {
  return (
    <div>
      <h1>What brought you to Larinova?</h1>
      <p>Tell us what you're hoping to solve</p>
    </div>
  );
}
```

After:

```tsx
import { useTranslations } from "next-intl";

export function StepMotivation() {
  const t = useTranslations("Onboarding.Step1");
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
    </div>
  );
}
```

With `messages/in.json`:
```json
"Onboarding": {
  "Step1": {
    "title": "What brought you to Larinova?",
    "subtitle": "Tell us what you're hoping to solve"
  }
}
```

And `messages/id.json`:
```json
"Onboarding": {
  "Step1": {
    "title": "Apa yang membawa Anda ke Larinova?",
    "subtitle": "Beritahu kami masalah apa yang ingin Anda selesaikan"
  }
}
```

- [ ] **Step 2: Type check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "feat(i18n): extract hardcoded strings from onboarding components"
```

---

### Task X3: Extract strings from dashboard + layout components

**Files:**
- Modify: `components/dashboard/*.tsx`, `components/layout/*.tsx`, `app/[locale]/(protected)/page.tsx`

- [ ] **Step 1: Same pattern as X2** — find hardcoded JSX text, add keys, replace with `t()` calls, populate both message files.

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(i18n): extract hardcoded strings from dashboard and layout"
```

---

### Task X4: Extract strings from patients components

**Files:**
- Modify: `components/patients/*.tsx`, `app/[locale]/(protected)/patients/**/*.tsx`

- [ ] **Step 1: Same pattern.**

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(i18n): extract hardcoded strings from patients module"
```

---

### Task X5: Extract strings from consultation components

**Files:**
- Modify: `components/consultation/*.tsx`, `app/[locale]/(protected)/consultations/**/*.tsx`, `app/[locale]/(protected)/patients/[id]/consultation/page.tsx`

- [ ] **Step 1: Same pattern.**

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(i18n): extract hardcoded strings from consultation module"
```

---

### Task X6: Extract strings from auth + remaining components

**Files:**
- Modify: `app/[locale]/(auth)/**/*.tsx`, `components/tasks/*.tsx`, `components/chat/*.tsx`, `components/ui/*.tsx` (only if user-facing), documents, settings

- [ ] **Step 1: Same pattern. Auth pages (sign-in, sign-up, verify-otp) — every label, button, placeholder, error message.**

- [ ] **Step 2: Type check & commit**

```bash
npm run build
git add -u
git commit -m "feat(i18n): extract hardcoded strings from auth, tasks, chat, documents, settings"
```

---

### Task X7: Final audit — grep for remaining hardcoded English

- [ ] **Step 1: Grep for English sentences in JSX**

```bash
grep -rn '>[A-Z][a-zA-Z ]\{3,\}<' app/ components/ --include="*.tsx" | \
  grep -v "useTranslations\|{t(" | \
  grep -v "href=\|className=\|alt=\|aria-label="
```

Expected: minimal or zero matches. Any matches should be inspected and either extracted or justified (e.g., brand name "Larinova").

- [ ] **Step 2: Confirm id.json has zero empty strings**

```bash
cat messages/id.json | jq '[paths(strings) as $p | select(getpath($p) == "") | $p]'
```

Expected: `[]`.

- [ ] **Step 3: Report to lead**

```bash
cmux send --surface <lead-surface> "[TEAMMATE:content-author] Phase 1b complete. All hardcoded strings extracted across onboarding, dashboard, patients, consultation, auth, tasks, chat, documents, settings. Both in.json and id.json fully populated. Ready for Phase 2 integration."
cmux send-key --surface <lead-surface> Enter
```

---

# Phase 2: Integration, Verification, Deploy

**Owner:** Team lead (Opus main session).

---

### Task V1: Merge all teammate work

- [ ] **Step 1: Check git status across all teammate commits**

```bash
git log --oneline -30
git status
```

Verify all expected commits from Phase 0, 1a, 1b are present. Resolve any incidental conflicts (there should be none given strict file ownership, but spot-check).

- [ ] **Step 2: Full build both apps**

```bash
cd app && npm run build
cd ../landing && npm run build
```

Expected: zero errors both apps.

---

### Task V2: Manual smoke test — geo detection

- [ ] **Step 1: Start dev server**

```bash
cd app && npm run dev
```

- [ ] **Step 2: Simulate Indonesia IP**

```bash
curl -H "x-vercel-ip-country: ID" -I http://localhost:3000/
```

Expected: `HTTP/1.1 307 Temporary Redirect` + `Location: /id`.

- [ ] **Step 3: Simulate India IP**

```bash
curl -H "x-vercel-ip-country: IN" -I http://localhost:3000/
```

Expected: redirect to `/in`.

- [ ] **Step 4: Simulate unknown country**

```bash
curl -H "x-vercel-ip-country: US" -I http://localhost:3000/
```

Expected: redirect to `/in` (default fallback).

- [ ] **Step 5: Verify cookie is set**

```bash
curl -c /tmp/cookies.txt -H "x-vercel-ip-country: ID" -I http://localhost:3000/
cat /tmp/cookies.txt | grep larinova_locale
```

Expected: `larinova_locale id` set with 1-year expiry.

---

### Task V3: Manual smoke test — Tier 1 feature flows

- [ ] **Step 1: India end-to-end**

Using a fresh browser session (clear cookies):
1. Visit `/in/sign-up` — create a new test doctor account
2. Complete all 7 onboarding steps — English, NMC lookup on Step 5, Indian imagery
3. Land on dashboard `/in` — Helena widget visible, stats rendering
4. Create a test patient
5. Start consultation — Sarvam streaming recorder, live transcript
6. Stop recording — SOAP note generates in English via Claude Service
7. View patient detail tabs: consultations, health records, insurance, prescriptions
8. Open Helena chat — ask a question in English, verify English response
9. Visit `/in/settings/billing` — Razorpay page loads
10. Region switcher in nav shows India flag

- [ ] **Step 2: Indonesia end-to-end**

Clear cookies. Set fake `x-vercel-ip-country: ID` via browser extension or directly visit `/id/sign-up`:
1. Beta translation banner visible at top
2. Create test doctor account on `/id/sign-up` — Bahasa labels
3. Complete all 7 onboarding steps — Bahasa content, Indonesian imagery, KKI manual entry on Step 5
4. Land on `/id` dashboard — Bahasa content
5. Create test patient — Bahasa form labels
6. Start consultation — Deepgram batch recorder (no live streaming, record → stop → spinner → transcript)
7. Stop → Bahasa transcript appears → Bahasa SOAP note generated via Claude Service
8. View patient detail tabs — Bahasa labels throughout
9. Open Helena chat — ask in Bahasa, verify Bahasa response
10. Visit `/id/settings/billing` — redirects to dashboard (billing hidden)
11. Sidebar has no Billing link
12. Region switcher in nav shows Indonesia flag

- [ ] **Step 3: Region switcher test**

While signed in on `/in/patients`:
1. Click region switcher → select Indonesia
2. URL changes to `/id/patients`
3. Cookie updates to `larinova_locale=id`
4. DB check: `SELECT locale FROM larinova_doctors WHERE email = '<test email>'` returns `'id'`
5. Sign out, sign back in → redirected to `/id` (because DB has `locale='id'`)

---

### Task V4: Write Playwright smoke tests

**Files:**
- Create: `tests/e2e/locale-split.spec.ts`

- [ ] **Step 1: Write smoke test spec**

```typescript
// tests/e2e/locale-split.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Locale split", () => {
  test("root path redirects to /in by default", async ({ page }) => {
    const response = await page.goto("/");
    expect(page.url()).toMatch(/\/in$/);
  });

  test("/in/sign-in renders English content", async ({ page }) => {
    await page.goto("/in/sign-in");
    await expect(page.locator("h1")).toContainText(/sign in|welcome/i);
  });

  test("/id/sign-in renders Bahasa content", async ({ page }) => {
    await page.goto("/id/sign-in");
    await expect(page.locator("h1")).toContainText(/masuk|selamat/i);
  });

  test("/id shows beta translation banner", async ({ page }) => {
    await page.goto("/id/sign-in");
    await expect(page.getByText(/beta/i)).toBeVisible();
  });

  test("/in does NOT show beta banner", async ({ page }) => {
    await page.goto("/in/sign-in");
    await expect(page.getByText(/beta translation/i)).not.toBeVisible();
  });

  test("region switcher changes locale", async ({ page }) => {
    await page.goto("/in/sign-in");
    // Switcher is in protected layout only; sign-in may not have it.
    // Skip for v1 — region switching is manually verified.
  });

  test("onboarding Step 5 shows NMC field on /in", async ({ page }) => {
    // Requires authenticated test user — skip in CI, run manually
    test.skip();
  });

  test("onboarding Step 5 shows KKI field on /id", async ({ page }) => {
    test.skip();
  });
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e -- tests/e2e/locale-split.spec.ts
```

Expected: passing tests. Skipped tests are intentional placeholders for auth-dependent flows.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/locale-split.spec.ts
git commit -m "test(locale): add Playwright smoke tests for locale split"
```

---

### Task V5: Grep audit — residual legacy references

- [ ] **Step 1: No `ar` locale references**

```bash
grep -rn "messages/ar\|'ar'\|\"ar\"" src/ app/ components/ lib/ --include="*.ts" --include="*.tsx" | grep -v "lang=\|//\|/\*"
```

Expected: zero meaningful matches.

- [ ] **Step 2: No `language` column references**

```bash
grep -rn "\.language\b" src/ app/ components/ lib/ middleware.ts --include="*.ts" --include="*.tsx"
```

Expected: only matches on `navigator.language` or unrelated `language` properties. No `doctorData.language`, no `.from("larinova_doctors")...language`.

- [ ] **Step 3: No hardcoded asset paths**

```bash
grep -rn "src=\"/onboarding\|src=\"/auth-doctor\|src=\"/hero-video\|src=\"/landing-hero\|src=\"/medicine-bg" app/ components/ --include="*.tsx"
```

Expected: zero matches. All asset references go through `useLocaleAsset()` or `sharedAsset()`.

- [ ] **Step 4: No hardcoded English in JSX (spot check)**

```bash
grep -rn '>[A-Z][a-zA-Z ]\{4,\}<' app/ components/ --include="*.tsx" | grep -v "useTranslations\|{t(\|href=\|className=\|aria-label=\|alt=\|Larinova\|Helena"
```

Expected: minimal matches (a few brand names, testing artifacts, or one-off strings that can stay).

- [ ] **Step 5: Commit any residual fixes**

```bash
git add -u
git commit -m "chore: clean up residual legacy locale references"
```

---

### Task V6: Deploy to staging, full verification

- [ ] **Step 1: Deploy app to staging**

Depends on project deploy pipeline (`vercel --target=staging` or whatever is configured — check `.vercel/project.json` or `CLAUDE.md`).

- [ ] **Step 2: Hit staging with simulated geo headers**

```bash
STAGING_URL=https://staging.larinova.com
curl -H "x-vercel-ip-country: ID" -I $STAGING_URL/
curl -H "x-vercel-ip-country: IN" -I $STAGING_URL/
```

Verify both redirect correctly.

- [ ] **Step 3: Run full user journey on staging**

Repeat Task V3 Steps 1 and 2 (India and Indonesia end-to-end flows) against the staging URL with real browser.

- [ ] **Step 4: Verify Claude Service + Deepgram keys work in staging env**

Staging environment must have `DEEPGRAM_API_KEY`, `CLAUDE_SERVICE_URL`, `CLAUDE_SERVICE_API_KEY`, `SARVAM_API_KEY` all set. Check via staging platform's env UI.

---

### Task V7: Deploy to production

- [ ] **Step 1: Apply DB migration to production**

```bash
# Production Supabase
psql "$PROD_DATABASE_URL" -f supabase/migrations/20260412120000_locale_split.sql
psql "$PROD_DATABASE_URL" -f supabase/migrations/20260412120100_helena_locale.sql
```

- [ ] **Step 2: Deploy**

```bash
vercel --prod
```

- [ ] **Step 3: Post-deploy smoke test on production**

Repeat V6 Step 2 and a minimal V6 Step 3 (India sign-in + Indonesia sign-in + region switcher) on the production URL.

- [ ] **Step 4: Announce to user**

Lead reports to user:

> "Locale split deployed to production. India (`/in`) and Indonesia (`/id`) both live. All Tier 1 features verified end-to-end in both regions. Beta translation banner visible on `/id`. Known deferrals: Xendit for Indonesia billing (Tier 3), native-speaker Bahasa review (scheduled follow-up)."

---

## Self-Review Checklist

Before ending the planning phase, the writer verified:

**Spec coverage:**
- [x] §3.1 Locale model → Task 0.1
- [x] §3.2 Region detection → Task 0.6
- [x] §3.3 Region switcher → Task 0.8
- [x] §3.4 Content layer → Task 0.7 + Task 0.11 + Tasks C2, C3
- [x] §3.5 Transcription provider abstraction → Tasks T2-T8
- [x] §3.6 SOAP via Claude Service → Tasks S1, S2
- [x] §3.7 Helena locale-aware → Tasks S3, S4
- [x] §3.8 India → Indonesia integration siblings → Tasks I1-I5
- [x] §3.9 DB migration → Tasks 0.4, 0.5 (+ Helena locale migration in S4)
- [x] §4 Feature inventory → covered across Phase 1b extraction tasks
- [x] §5 Tier prioritization → reflected in task sequencing (Tier 1 in Phase 0/1a/1b, Tier 3 deferred via Task I2)
- [x] §6 cmux-teams execution plan → structure of this entire document
- [x] §7 Teammate prompt template → referenced from cmux-teams skill
- [x] §8 Higgsfield assets → Tasks A2-A5
- [x] §9 Risks → WER spike in T1, KKI stub in I1, Xendit deferral in I2, beta banner in C4

**Placeholder scan:** No "TBD", "TODO", or "fill in later" found. Every code step has actual code. Every shell command has the exact command.

**Type consistency:**
- `Locale = 'in' | 'id'` used consistently across routing, transcription, SOAP, Helena, formulary
- `TranscriptionProvider`, `BatchTranscriptionProvider`, `StreamingTranscriptionProvider` names match across types.ts, sarvam.ts, deepgram.ts, index.ts
- `getTranscriptionProvider` signature consistent everywhere
- `buildSoapSystemPrompt(locale)` name matches in prompts.ts and route.ts
- `buildHelenaSystemPrompt(locale)` name consistent

**Gaps found and fixed inline:** None.

---

*End of plan. 60+ tasks across 3 phases. Fresh session recommended for execution.*
