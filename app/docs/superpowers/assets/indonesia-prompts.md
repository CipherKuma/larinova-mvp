# Indonesia Asset Generation Prompts

**Generated:** 2026-04-12  
**Target:** `public/id/`  
**Branch:** india-pilot

All assets must match the visual language of existing India assets in `public/in/` — same lighting, composition, framing. Only the people and setting should reflect Indonesia.

## Source Dimensions (India originals)

| Asset | Dimensions | Ratio |
|-------|-----------|-------|
| Onboarding stills (step1–step5) | 800×1067 | ~3:4 portrait |
| auth-doctor.jpg | 2048×1152 | 16:9 landscape |
| landing-hero.mp4 | 1920×1080 | 16:9 landscape |

## Style rules (apply to all assets)

- **Subjects:** Mix of Javanese, Sundanese, Balinese features — natural Indonesian demographics
- **Wardrobe:** Clean white doctor coats, stethoscopes, minimal accessories
- **Settings:** Bright modern private Indonesian clinics — no regional kitsch, no batik patterns on walls
- **Lighting:** Natural daylight, warm tones, shallow depth of field
- **Color grade:** Match the existing Indian imagery color palette — warm, clean, clinical

## Assets

### 1. `public/id/onboarding/step1-motivation.jpg`

**Dimensions:** 800×1067 (3:4 portrait)

**Prompt:** Indonesian doctor at a modern clinic desk, visibly overwhelmed by stacks of paper charts and insurance forms, slightly furrowed brow, natural daylight from a window, mid-30s, wearing white coat with stethoscope around neck, shallow depth of field, warm color grade, 3:4 portrait ratio

---

### 2. `public/id/onboarding/step2-specialty.jpg`

**Dimensions:** 800×1067 (3:4 portrait)

**Prompt:** Indonesian female doctor in a modern pediatric clinic examination room, holding a small child-sized blood pressure cuff, warm welcoming expression, early 30s, white coat, natural daylight, shallow depth of field, 3:4 portrait ratio

---

### 3. `public/id/onboarding/step3-demo.jpg`

**Dimensions:** 800×1067 (3:4 portrait)

**Prompt:** Indonesian male doctor holding a tablet displaying a clean medical software interface, pointing at the screen with approving expression, modern clinic background out of focus, late 30s, white coat, 3:4 portrait ratio

---

### 4. `public/id/onboarding/step4-prescription.jpg`

**Dimensions:** 800×1067 (3:4 portrait)

**Prompt:** Close-up of hands writing on an Indonesian prescription pad with a fountain pen, small medication bottles blurred in background, desk with stethoscope and reading glasses, warm ambient lighting, macro, 3:4 portrait ratio

---

### 5. `public/id/onboarding/step5-registration.jpg`

**Dimensions:** 800×1067 (3:4 portrait)

**Prompt:** Indonesian doctor credentials on a desk — hanging ID badge, framed medical license certificate with Indonesian text, stethoscope, natural daylight, shallow depth of field, 3:4 portrait ratio

---

### 6. `public/id/auth-doctor.jpg`

**Dimensions:** 2048×1152 (16:9 landscape)

**Prompt:** Indonesian doctor, mid-30s, warm smile, looking slightly off-camera, clean white coat with stethoscope, bright modern clinic background softly blurred, natural warm daylight, professional portrait, matches the framing and pose of existing auth-doctor.jpg, 16:9 landscape ratio

---

### 7. `public/id/landing-hero.mp4`

**Dimensions:** 1920×1080 (16:9)  
**Duration:** 10 seconds, seamlessly looping

**Prompt (video):** Indonesian doctor consulting with a patient in a modern clinic room, gentle ambient motion — doctor nodding, patient speaking, doctor taking notes on tablet. Natural warm daylight, shallow depth of field. Subtle slow camera push-in. Looping seamlessly. 1920x1080, 10 seconds.

---

## Generation order

1. Stills first (assets 1–6) — fastest to iterate
2. Video last (asset 7) — longest generation time, start in parallel with stills if supported
