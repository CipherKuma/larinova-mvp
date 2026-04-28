# Larinova AI — India Launch Landing Page Design

**Date:** 2026-03-18
**Status:** SUPERSEDED — see `docs/superpowers/specs/2026-04-23-india-opd-platform-design.md`. The scribe-only hero captured here was replaced by the OPD reframe in late April 2026; live copy now lives in `landing/src/data/locale-content.ts` under the `opd:` block.
**Branch:** `india-launch`

---

## Foundation

| Element | Choice |
|---------|--------|
| **Base colors** | Deep navy `#0a0f1e`, charcoal `#111827`, card bg `#1a1f2e` |
| **Accent** | Emerald `#10b981` (primary), teal `#0d9488` (secondary) |
| **Text** | White `#f9fafb` (headlines), slate `#94a3b8` (body), emerald (highlights) |
| **Typography** | Satoshi (display/headings), Inter (body), IBM Plex Mono (stats/technical) |
| **Animations** | GSAP ScrollTrigger, Lenis smooth scroll, clip-path transitions |
| **Texture** | SVG grain at 3-4% opacity, radial gradient glows |
| **Borders** | `rgba(255,255,255,0.06)` subtle dividers |

---

## Section 1: Hero

**Layout:** Left 55% text, right 45% live demo animation

**Left:**
- "Powered by Sarvam AI" badge (emerald border pill, Sarvam logo)
- Headline (Satoshi Bold, 64-80px): "Your patients speak Tamil. Your scribe should too."
- Subheadline (Inter, slate): "AI medical scribe that listens to your consultations in Tamil, Hindi, or English — and generates structured clinical notes in real-time."
- CTAs: "Start Free Trial" (emerald filled) + "Book a Demo" (ghost outline)
- Trust line (mono, small): "22 languages / SOAP notes / ICD-10 codes / Prescriptions"

**Right:**
- Dark card with emerald glow border showing live transcription simulation:
  - Waveform animation (recording)
  - Tamil+English code-mixed text appearing line by line
  - SOAP note output generating below
- Continuous loop animation

**Animations:**
- Headline: staggered word reveal (opacity + y, 0.04s/word)
- Demo card: fade in from right with slight scale
- Background: radial emerald gradient at 5% opacity + grain

---

## Section 2: Problem

**Headline (Satoshi, large):** "Indian doctors lose 2+ hours daily to paperwork"

**Layout:** 3 large typographic callouts, staggered on scroll

| Stat | Label |
|------|-------|
| 2+ hours | Lost daily to documentation |
| 40-60% | Consultations in regional languages |
| ₹0 | Existing AI scribes that understand Tamil |

**Style:** Each stat is huge (120-160px Satoshi Bold), label below in Inter slate. No cards, no borders — just typography and breathing space.

**Animation:** Each stat staggers in on scroll (y + opacity, 0.2s delay between)

---

## Section 3: How It Works (Scroll-Scrubbed)

**Pattern:** GSAP ScrollTrigger pinned section. 3 steps, each gets full viewport. Scroll scrubs through them.

**Step 1: Record**
- Large verb: "RECORD."
- Description: "Tap to start. Larinova listens to your consultation — ambient, non-intrusive. Works in noisy OPDs."
- Visual: Phone mockup with recording interface, waveform animation

**Step 2: Transcribe**
- Large verb: "TRANSCRIBE."
- Description: "Sarvam AI processes Tamil+English code-mixed speech in real-time. Medical terminology recognized natively."
- Visual: Transcript appearing with speaker labels (Doctor/Patient), highlighted medical terms

**Step 3: Document**
- Large verb: "DOCUMENT."
- Description: "Structured SOAP notes, ICD-10 codes, prescriptions — generated instantly. Review, edit, export."
- Visual: SOAP note card with sections highlighted, prescription preview

**Progress:** Step counter (01/03, 02/03, 03/03) + progress bar filling per step

**Animation:** Reuse hackathon clip-path pattern — text exits left, visual collapses via clip-path, new content enters

---

## Section 4: Features Deep-Dive

**Layout:** Alternating left/right sections. Each feature gets full breathing room. No card grid.

**Features (4 total):**

1. **Real-Time Transcription** (left text, right preview)
   - "Understands how Indian doctors actually talk"
   - ScribingPreview: waveform + live transcript with Tamil+English code-mixing
   - Tags: Tamil, Hindi, Telugu, English, Code-mixing, Medical NLP

2. **SOAP Note Generation** (right text, left preview)
   - "From conversation to clinical documentation in seconds"
   - SOAPPreview: typing animation through S → O → A → P sections
   - Tags: Structured notes, Auto-formatting, Template support

3. **Medical Coding** (left text, right preview)
   - "ICD-10 and CPT codes suggested automatically"
   - CodingPreview: code suggestions with confidence scores
   - Tags: ICD-10, CPT, Faster billing, Reduced claim denials

4. **Prescription Generation** (right text, left preview)
   - "Prescriptions drafted from the conversation"
   - New PrescriptionPreview: medication list with dosage, duration, interactions
   - Tags: Drug interactions, Dosage check, Print-ready

**Animation:** Each feature fades in on scroll (GSAP ScrollTrigger, opacity + y)

---

## Section 5: Powered by Sarvam

**Layout:** Centered section with Sarvam branding

**Headline:** "Built on India's sovereign AI infrastructure"
**Subheadline:** "Larinova is powered by Sarvam AI — India's full-stack AI platform with native support for 22 Indian languages."

**Content:**
- Sarvam logo (prominent)
- Language grid showing 22 supported languages (Tamil highlighted as primary)
- Key stats: "22 languages / <500ms latency / Code-mixing native / Medical vocabulary trained"

**Style:** Subtle emerald gradient background, Sarvam branding prominent. Satisfies "Powered by Sarvam" program requirement.

---

## Section 6: Pricing

**Layout:** Two cards side by side, centered

**Free Trial:**
- 14 days free
- Full feature access
- 50 consultations included
- No credit card required
- CTA: "Start Free Trial"

**Pro:**
- ~~₹1,999/month~~ → ₹999/month (early adopter pricing)
- "Launch pricing for first 100 doctors"
- Unlimited consultations
- All languages
- Priority support
- Export to any EHR
- CTA: "Get Started"

**Style:** Dark cards with subtle border, Pro card has emerald accent border + "RECOMMENDED" badge

---

## Section 7: Final CTA

**Headline:** "Ready to reclaim your time?"
**Subheadline:** "Join doctors across Tamil Nadu who are spending less time on paperwork and more time with patients."
**CTA:** "Start Free Trial" (large emerald button)
**Below:** "No credit card required / 14-day free trial / Cancel anytime"

**Background:** Emerald radial gradient glow behind CTA

---

## Navigation

**Fixed top nav, transparent → blur on scroll**
- Logo (left)
- Links: How It Works, Features, Pricing (center)
- CTA: "Start Free Trial" (right, small emerald button)

---

## Footer

**Dark, minimal**
- Logo + one-line description
- Links: Product, Company, Legal
- "Powered by Sarvam AI" badge
- Social links (when ready)
- Copyright

---

## Technical Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- GSAP + @gsap/react (scroll animations)
- Lenis (smooth scroll)
- Satoshi font (via Fontsource or self-hosted)
- Inter font (via next/font)
- IBM Plex Mono (via Fontsource)

## Assets Needed

- Sarvam AI logo (download from sarvam.ai)
- Phone/device mockups for How It Works steps
- Feature preview components (port from main branch: ScribingPreview, SOAPPreview, CodingPreview)
- New PrescriptionPreview component
- Waveform animation component
- Live transcription simulation component (Tamil+English)
