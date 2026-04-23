# Larinova Onboarding Redesign — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Goal:** Transform the onboarding from sterile form-filling into an engaging, animated experience that builds to an "aha moment" — the doctor speaks Tamil and sees a SOAP note appear.

---

## Overview

5-step flow replacing the current 3-step form. Every step has purpose: motivation → profile → live demo → output preview → celebration. The doctor experiences the product's core value *during* onboarding, not after.

**Key principle:** Sarvam AI powers everything end-to-end. No other AI service involved.

---

## Background Aesthetic

**Particle Dust** — consistent across all 5 steps.

- Deep navy canvas (`#0a0f1e`)
- ~20-30 tiny floating dots: some emerald (`rgba(16,185,129,0.3-0.4)`), some white (`rgba(255,255,255,0.1-0.2)`)
- Slow drift animation (15-25s cycles), almost imperceptible
- Subtle emerald radial glow at center (`rgba(16,185,129,0.04)`)
- Grain texture overlay (existing `.grain` class)
- No video background

**Progress indicator:** Animated emerald line at top of viewport. Grows from left to right as steps complete (20% → 40% → 60% → 80% → 100%). Stays fixed during sub-phases within a step (e.g., Step 3 phases A/B/C all show 60%). Smooth `transition: width 0.6s ease`.

**Step transitions:** `framer-motion` `AnimatePresence` with opacity + scale (0.95 → 1.0). 300ms duration. Exit: opacity 0, scale 0.98.

**Back navigation:** A subtle back arrow (top-left, below progress bar) on Steps 2-4. Step 1 has no back. Step 5 has no back (celebration is final). Step 3 back returns to Step 2 (recording state is reset).

**Refresh behavior:** No progress persistence. Refresh restarts from Step 1. This is acceptable — the flow takes <3 minutes and data is only saved at completion.

---

## Step 1: "What brings you here?"

**Purpose:** Mental model building. Doctor selects pain points that resonate. Not data collection — emotional buy-in.

**Layout:**
- Centered content, max-width 600px
- Larinova logo at top (larinova-icon.png, brightness-0 invert, 140px wide)
- Heading: "What brings you here?" (Outfit, 2xl, font-bold)
- Subtitle: "Select everything that resonates" (text-muted-foreground)
- 4 pain point cards (multi-select)
- "Continue" button at bottom (primary, disabled until ≥1 selected)

**Pain point cards:**

1. **"My patients and I speak in Tamil, but I need documentation in English"** — featured/hero card, slightly larger, emerald left border
2. **"I spend more time on paperwork than with patients"**
3. **"I need proper prescriptions but I'm still handwriting them"**
4. **"I can't remember everything from a 15-minute consultation"**

**Card component (shared across Step 1 & 2):**
- Base: `bg-card/50 border border-border/50 rounded-xl p-5 cursor-pointer transition-all duration-200`
- Hover: `border-border/80`
- Selected: `border-primary bg-primary/5` with emerald glow pulse animation (0.3s)
- Checkmark icon appears top-right on selection (Step 1 multi-select, Step 2 single-select)

**Animations:**
- Cards stagger in on mount (100ms delay between each, fade + translateY 20px)
- Selection triggers a brief emerald pulse (`box-shadow: 0 0 20px rgba(16,185,129,0.2)` → fade out)

**Data:** Pain point selections are NOT saved to DB. Used only for onboarding UX.

---

## Step 2: "Tell us about you"

**Purpose:** Collect specialty + optional registration details. Compact, not overwhelming.

**Layout — Phase A (Specialty selection):**
- Heading: "What's your specialty?" (Outfit, 2xl)
- Grid of 10 popular specialty cards (2 columns on mobile, 3 on tablet, 4 on desktop)
- "Other specialty" card at end → opens searchable text input with autocomplete from hardcoded list of 40+ specialties
- Single select — clicking one deselects others
- Uses same card component as Step 1

**Exact 10 popular specialties (in this order):**
1. General Practitioner
2. Pediatrician
3. Cardiologist
4. Dermatologist
5. Gynecologist / Obstetrician
6. Orthopedist
7. ENT Specialist
8. Ophthalmologist
9. Pulmonologist
10. General Surgeon

**"Other specialty" search:** Hardcoded list of ~40 Indian medical specialties (Neurologist, Nephrologist, Urologist, Gastroenterologist, Psychiatrist, Oncologist, Endocrinologist, Rheumatologist, Anesthesiologist, Radiologist, Pathologist, etc.). Client-side filter — no API call.

**Layout — Phase B (Registration details — sequential reveal):**
After specialty selection, registration fields animate in below with a smooth height expansion (framer-motion `layout` + `AnimatePresence`).

- Heading: "Add your credentials" with subtitle "(optional — you can do this later in Settings)"
- Fields:
  - Degrees (text input, placeholder "e.g., MBBS, MD")
  - Registration Number (text input, placeholder "e.g., TN/12345")
  - Registration Council (dropdown with exact values):
    - "Medical Council of India (MCI)"
    - "Tamil Nadu Medical Council"
    - "Karnataka Medical Council"
    - "Andhra Pradesh Medical Council"
    - "Kerala Medical Council"
    - "Maharashtra Medical Council"
    - "Other State Medical Council"
- "Continue" button (enabled as soon as specialty is selected, regardless of registration fields)

**Animations:**
- Specialty cards stagger in (same pattern as Step 1)
- Registration fields expand in with height animation (300ms ease-out)
- Fields stagger in (50ms delay each)

---

## Step 3: "Try the magic" — The Aha Moment

**Purpose:** Doctor experiences the core product value live. Speaks Tamil, sees transcription, gets a SOAP note. This is the hook.

**Layout — Phase A (Prompt):**
- Large heading: "Let's try something magical" (Outfit, 3xl)
- Subtitle: "Tap the mic and speak like you're talking to a patient — in Tamil, English, or both"
- Language selector pills: Tamil `ta-IN` (default), English `en-IN`, Hindi `hi-IN`. This controls the Sarvam STT language code. If Tamil or Hindi selected, translation to English happens automatically before SOAP generation.
- Large mic button center-screen (80px, emerald bg, white icon, pulsing glow ring animation when idle)
- "This is a demo — no data is saved" reassurance text below
- **"Skip demo →"** link (small, muted, bottom-right) — skips directly to Step 4

**Microphone permission denied:**
If browser denies mic access, show:
- Icon: mic with a slash
- "Microphone access is needed for the demo"
- "Allow microphone in your browser settings, or skip this step"
- "Skip demo →" button (primary this time, not just a link)

**Layout — Phase B (Recording):**
- Mic button pulses with recording animation (concentric emerald rings expanding outward)
- Transcript appears below mic in a clean container, updating as audio chunks are processed (~every 4 seconds, matching existing chunked recording pattern)
- Timer showing recording duration (top-right of container)
- "Stop" button replaces mic button after 3 seconds minimum
- Auto-stop after 15 seconds. Wait for any pending transcription chunks to finish processing (show a small spinner), then proceed to Phase C.

**Layout — Phase C (Processing → SOAP note):**
After stopping and all chunks are processed:
1. Full transcript text visible in container
2. Shimmer animation plays (emerald gradient sweep left to right, 1.5s)
3. Two API calls fire in sequence:
   - If non-English language selected: `POST /api/sarvam/translate` (transcript → English)
   - Then: `POST /api/sarvam/soap` (English text → SOAP note)
4. "SOAP Note" card expands in below transcript:
   - If Tamil/Hindi: show "Original: [Tamil text]" → "Translation: [English text]" → SOAP sections
   - If English: show transcript → SOAP sections directly
5. SOAP note sections animate in one by one (S, O, A, P) with 200ms stagger
6. "This is what every consultation will look like." text fades in below
7. "Continue" button appears

**Sarvam API flow:**
1. Audio chunks → `POST /api/sarvam/transcribe` (existing endpoint, uses `/speech-to-text`)
2. Full transcript → `POST /api/sarvam/translate` (new endpoint, uses Sarvam `/translate`)
3. English text → `POST /api/sarvam/soap` (new endpoint, uses Sarvam `/chat/completions`)

**SOAP prompt (for `/api/sarvam/soap`):**
```
System: You are a medical documentation assistant. Generate a SOAP note from the following consultation transcript. Format with clear S (Subjective), O (Objective), A (Assessment), P (Plan) sections. Keep it concise and professional. If the transcript is short or incomplete, fill in reasonable placeholder content for a demo.

User: [English transcript text]
```

**Fallback (if Sarvam LLM fails or >8s timeout):**
Show a template SOAP note with the doctor's actual words:
- **S (Subjective):** "[Doctor's actual transcribed words]"
- **O (Objective):** "Vitals within normal limits. Physical examination findings to be documented during consultation."
- **A (Assessment):** "Assessment pending full clinical evaluation."
- **P (Plan):** "1. Complete clinical evaluation\n2. Order relevant investigations\n3. Follow-up as needed"

**Doctor's name source:** `user.user_metadata?.full_name` from Supabase auth (set during sign-up). Falls back to email prefix.

---

## Step 4: "Your prescriptions will look like this"

**Purpose:** Quick visual payoff showing MCI-compliant prescription output with their details pre-filled.

**Layout:**
- Heading: "Your prescriptions, ready to print" (Outfit, 2xl)
- Prescription preview card slides up from bottom (framer-motion, translateY 40px → 0, 500ms spring)
- MCI-format prescription showing:
  - Header: "Dr. [Full Name], [Degrees or *Your Degrees*]"
  - "Reg No: [Number or *Your Reg Number*] ([Council or *Your Council*])"
  - "[Clinic Name or *Your Clinic*]" — clinic name not collected in onboarding, always shows placeholder in italic
  - Patient section with sample data (Ravi Kumar, M, 45, 72kg)
  - 2 sample medicines: PARACETAMOL 500MG (1-0-1, 5 days, After food), AMOXICILLIN 250MG (1-1-1, 7 days, After food)
  - Signature line with doctor name
- Placeholder text rendered in italic muted color to distinguish from real data
- "Continue" button below

**Animations:**
- Card slides up from bottom with spring physics
- Content fades in with 200ms delay after card lands
- Subtle emerald shadow glow on the card

---

## Step 5: "You're ready"

**Purpose:** Celebration moment → auto-redirect to dashboard.

**Layout:**
- Large heading: "You're ready, Dr. [Full Name]" (Outfit, 3xl, text-gradient)
- Subtitle: "[Specialty]" (text-muted-foreground)
- Emerald particle burst animation (canvas-based, 50-80 particles, 1.5s, gravity + fade)
- Three quick-start hints fade in (staggered, 300ms delay each):
  - "Start your first consultation"
  - "Add your first patient"
  - "Explore Helena AI assistant"
- Auto-redirect to `/en` (dashboard) after 3 seconds. No `?startTour=true` — the new onboarding replaces the tour.
- Small progress text: "Taking you to your dashboard..."

**Animations:**
- Particle burst on mount (emerald + white particles radiating from center)
- Heading fades in word by word (100ms stagger per word)
- Quick-start hints stagger in after particles settle

---

## Data Flow

**What gets saved to `larinova_doctors` on completion (Step 5 triggers save):**
- `specialization` — selected specialty string (required)
- `degrees` — if provided, else null
- `registration_number` — if provided, else null
- `registration_council` — if provided, else null (exact string from dropdown)
- `language` — hardcoded `"en"` (India pilot is English-only)
- `onboarding_completed` — `true`

**Fields NOT collected in onboarding (deferred to Settings page):**
- `clinic_name` — collected later in profile/settings
- `clinic_address` — collected later in profile/settings

**New API routes needed:**
- `POST /api/sarvam/translate` — text translation via Sarvam `/translate` endpoint
- `POST /api/sarvam/soap` — SOAP note generation via Sarvam `/chat/completions` endpoint

**Existing routes used:**
- `POST /api/sarvam/transcribe` — speech-to-text (already built)

---

## i18n

The onboarding uses English strings directly (not i18n keys) since the India pilot is English-only. The existing `messages/en.json` onboarding keys become dead code but are left in place — they don't hurt and may be useful if we add language selection back later. Arabic onboarding strings in `messages/ar.json` are also left as-is.

---

## Technical Notes

- **Animation library:** framer-motion (already installed)
- **Particle dust background:** CSS-based (positioned divs with keyframe animations)
- **Particle burst (Step 5):** Canvas-based, self-contained in StepCelebration
- **Audio recording:** Extract clean recording logic from TranscriptionViewSarvam into a `hooks/useAudioRecorder.ts` hook. The hook handles MediaRecorder, chunked blob creation, and cleanup. Step 3 and the existing TranscriptionViewSarvam both consume this hook.
- **State management:** local useState in the orchestrator page — linear flow, no need for zustand
- **Card component:** Shared `OnboardingCard` component used by both Step 1 (multi-select) and Step 2 (single-select), with a `mode` prop

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/onboarding/ParticleDust.tsx` | Background particle animation (CSS-based) |
| `components/onboarding/OnboardingCard.tsx` | Shared selectable card component |
| `components/onboarding/ProgressBar.tsx` | Top emerald progress line |
| `components/onboarding/StepMotivation.tsx` | Step 1 — pain point cards |
| `components/onboarding/StepProfile.tsx` | Step 2 — specialty + credentials |
| `components/onboarding/StepMagic.tsx` | Step 3 — live transcription + SOAP demo |
| `components/onboarding/StepPrescription.tsx` | Step 4 — prescription preview |
| `components/onboarding/StepCelebration.tsx` | Step 5 — particle burst + redirect |
| `hooks/useAudioRecorder.ts` | Clean audio recording hook (MediaRecorder + chunking) |
| `app/api/sarvam/translate/route.ts` | Sarvam translation endpoint |
| `app/api/sarvam/soap/route.ts` | Sarvam SOAP generation endpoint |
| `lib/sarvam/prompts.ts` | SOAP generation system prompt |

## Files to Modify

| File | Change |
|------|--------|
| `app/[locale]/onboarding/page.tsx` | Complete rewrite — orchestrator for 5 steps |
| `lib/sarvam/client.ts` | Add `translateText()` and `generateSOAP()` functions |
| `lib/sarvam/types.ts` | Add types for translate + chat APIs |
