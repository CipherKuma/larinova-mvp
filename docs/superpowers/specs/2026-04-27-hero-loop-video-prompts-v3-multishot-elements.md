# Hero Loop Video v3 — Single Multi-shot Job with @Elements

**Date:** 2026-04-27
**Concept:** Same cinematic dive-in arc as v2, but generated as ONE Kling 3.0 multi-shot job. Each shot references its own pre-generated still via Higgsfield's `@Elements` syntax — so per-shot anchoring works WITHOUT 4 separate jobs.

**Why v3 over v2:**

| | v2 (4 separate Kling jobs + ffmpeg) | **v3 (1 multi-shot job + @Elements)** |
|---|---|---|
| Generations | 4 | 1 |
| Credits | ~72 | ~30-40 |
| Stitching | ffmpeg concat | None |
| Color/lighting consistency | drift risk between clips | locked end-to-end |
| Loop seam | hard cut at clip boundaries | continuous render |
| Per-shot UI fidelity | ✅ start+end frame per clip | ✅ `@frame_N` per shot |

**Why v3 over v1:**
- v1 didn't use `@Elements` because we hadn't found that feature yet. Same fix as v2 (full UI fidelity), now also single-job.

**Replaces:** v2 (`2026-04-27-hero-loop-video-prompts-v2-cinematic-divein.md`).

---

## Pipeline

```
Stage 1                           Stage 2                                      Stage 3
GPT-2 image gen in Higgsfield  →  Upload 4 stills as @Elements             →  Drop into landing
4 cinematic stills              + Kling 3.0 multi-shot Custom (4 shots)        public/videos/
(walnut desk + UI dive-in)        Each shot @-references its frame                hero-loop.mp4
```

**Source screenshots (uploaded to GPT-2 as reference per still):**
- `/tmp/larinova-demo-shots/01-orb.png`
- `/tmp/larinova-demo-shots/02-transcript.png`
- `/tmp/larinova-demo-shots/03-soap.png`
- `/tmp/larinova-demo-shots/04-prescription.png`

---

## Stage 1 — Cinematic stills (Higgsfield IMAGE · GPT-2)

> Toolbar: GPT-2 (latest), 16:9, 4K. **Do NOT include in prompt text.**

The 4 image prompts are unchanged from v2. They produce stills that get uploaded as Elements in Stage 2.

### MASTER_SCENE — used at the start of every image prompt

> *"Cinematic close-up of a modern matte-black smartphone, face-up, perfectly centered slightly above the lower third of the frame, lying on a polished walnut desk with a faint warm grain. Soft warm key light from upper-left at 3000K, like late-afternoon sun through clinic blinds. Faint reflection of the phone in the desk surface. Out-of-focus background context: edge of a stethoscope at upper-left, hint of a prescription pad upper-right, all heavily blurred at f/1.8. Doctor's hand at the bottom-right corner, fingers relaxed, brown skin tone. Subtle 35mm anamorphic film grain, premium product-film aesthetic. The phone occupies roughly 30% of the frame width. No camera tilt — perfectly level."*

### IMAGE 1 — Wide phone on desk (loop seam)
- **Reference image:** `01-orb.png`
- **Prompt:** {{MASTER_SCENE}}. The phone screen displays the reference image exactly: a deep blue-black UI with a glowing emerald-green spinning orb in the center, "00:42" timer below, "Listening · Arun Pillai" caption, a "REC · 00:42" pill in the top-left, and a "Tamil + English · Sarvam AI" pill at the bottom. The orb's emerald glow softly illuminates the surrounding desk surface with a green ambient bounce. Hyper-detailed, the screen is the brightest object in the frame.

### IMAGE 2 — Inside the screen, transcript view (full-frame UI)
- **Reference image:** `02-transcript.png`
- **Prompt:** A massive cinematic full-frame view of a medical AI live transcript UI, no phone shell visible. We are inside the device. The frame is filled by the UI: a "Live transcript" header with a pulsing green dot at the top, a patient strip showing "Arun Pillai · 52 · M · T2DM follow-up", and four large legible conversation lines with color-coded DOCTOR (emerald) and PATIENT (amber) speaker pills. Tamil and English text mixed, every word readable across a room. A typing cursor blinks at the latest line. The text scale is 4-5x what it would be on a real phone. Background: deep blue-black cinematic space with a subtle emerald glow at the edges, gentle particle haze suggesting depth, faint warm light bleeding in from the left edge as if we just passed through the phone screen surface. Photorealistic, premium product-film aesthetic, 35mm anamorphic feel.

### IMAGE 3 — Inside the screen, SOAP cards floating in 3D
- **Reference image:** `03-soap.png`
- **Prompt:** A massive cinematic full-frame view of a medical SOAP note assembling itself, no phone shell visible. We are still inside the device. A bold "Diagnosis: Type 2 Diabetes Mellitus with diabetic peripheral neuropathy / E11.42" callout floats at the top center. Four labeled SOAP section cards (S=emerald, O=sky blue, A=amber, P=violet) float behind the diagnosis with subtle 3D parallax depth — each card large enough to read clinical findings clearly. A small AI sparkle icon glows in the corner of the diagnosis card. Soft drop shadows. Same deep blue-black cinematic space as Image 2, emerald glow at edges, gentle drifting particles, subtle vignette. 35mm anamorphic feel.

### IMAGE 4 — Prescription + 3 chips bursting outward (all sent)
- **Reference image:** `04-prescription.png`
- **Prompt:** A cinematic full-frame composition: a large emerald-glowing prescription card occupies the center of the frame, displaying "RX-2026-0001 · Active", patient (Arun Pillai), doctor (Dr. Gabriel Antony), and two medication cards (Metformin SR 1000mg, Pregabalin 75mg). Three large floating notification chips BURST outward from the prescription card toward the corners of the frame, all three equally bright and equally "sent" — an emerald-glowing "Email sent" chip toward the upper-left, a sky-blue-glowing "SMS sent" chip toward the upper-right, a green-glowing "WhatsApp sent" chip toward the lower-right. Each chip has its own colored glow halo and trails a long sweeping particle wake in its matching color (emerald, sky, green). At the very edges of the frame, the dark walnut desk surface is just beginning to reappear at the corners, as if the camera is starting to pull back through the phone screen. Sense of climax — every channel delivered.

After generating: download all 4 stills as PNG. Name them `frame_1.png`, `frame_2.png`, `frame_3.png`, `frame_4.png`.

---

## Stage 2 — Single Kling 3.0 multi-shot job

### Toolbar setup

> Toolbar (set in Higgsfield Create Video page — **do NOT include in prompt**):
> - Model: **Kling 3.0**
> - Aspect: **16:9**
> - Quality: **4K**
> - Multi-shot: **ON · Custom**
> - Per-shot duration: **3s** (× 4 shots = 12s total)
> - **Start frame: `frame_1.png`** (mandatory)
> - **End frame: `frame_1.png`** (upload the SAME file again — closes the loop seam)

### Elements panel — Higgsfield max is 3 Elements

Upload only the intermediate stills as Elements. `frame_1` is already in the Start + End frame slots, so it does NOT need to be an Element. This keeps us at exactly 3 Elements (the limit):

- `@frame_2` ← Image 2 (full-frame transcript UI)
- `@frame_3` ← Image 3 (full-frame SOAP cards)
- `@frame_4` ← Image 4 (prescription + 3 chips bursting)

### Shot prompts (4 shots, Custom mode)

> **Higgsfield per-shot character limit ~500.** Each prompt below is under 400 chars. Don't pad — Kling does better with terse, punchy direction.

#### Shot 1 — Dolly IN through the screen (3s · 288 chars)
> Cinematic dolly-in — camera punches forward through the phone screen, desk and surroundings rush out with motion blur. We pass through the glass and emerge inside the device. End at @frame_2: full-frame live transcript, color-coded DOCTOR / PATIENT pills, bilingual text. Smooth acceleration, no cut.

*(No `@frame_1` — the Start frame slot already anchors the opening. Don't waste an Element on it.)*

#### Shot 2 — Transcript morphs into SOAP (3s · 285 chars)
> Start at @frame_2. Camera locked, no movement. Transcript lines compress and slide downward, fading. SOAP cards S, O, A, P slide in from off-screen with 3D parallax, typing cursor revealing each line. End at @frame_3. Same dark cinematic background, emerald edge glow unchanged.

#### Shot 3 — Chips BURST outward (3s · 317 chars)
> Start at @frame_3. Camera locked. SOAP cards collapse into a single emerald prescription card at center. Three chips BURST outward simultaneously — emerald Email upper-left, sky-blue SMS upper-right, green WhatsApp lower-right — each with its own colored particle trail. End at @frame_4. Magical, climactic.

#### Shot 4 — Dolly OUT, loop closure (3s · 340 chars)
> Start at @frame_4. Dolly-out — camera retreats from inside a phone, back through the glass screen. Chips dissolve. The device that resolves stays a portrait black smartphone — never a tablet, never a laptop, aspect stays portrait throughout. End matches the start frame: phone face-up on walnut desk, identical opening. Smooth deceleration.

*(No `@frame_1` — the End frame slot anchors the closing. The phrase "matches the start frame" tells Kling to land on the End frame image.)*

---

## Stage 3 — Drop into landing

The video downloads as a single `.mp4`. No stitching.

```bash
# Re-encode for web (strip audio, h.264 + faststart)
ffmpeg -i ~/Downloads/<higgsfield-output>.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -movflags +faststart \
  -an \
  ~/Downloads/hero-loop-web.mp4

# Drop into landing
cp ~/Downloads/hero-loop-web.mp4 \
  /Users/gabrielantonyxaviour/Documents/products/larinova/landing/public/videos/hero-loop.mp4
```

The landing already has `<video src="/videos/hero-loop.mp4" autoplay loop muted playsInline>` wired in `landing/src/components/HeroIndia.tsx`. Replacing the file is enough — no code change.

---

## Quality checklist

- [ ] **Loop seam invisible** — last frame matches `@frame_1` so the autoloop reads as one continuous take
- [ ] **Tamil characters** in Shot 1's transition into transcript (`@frame_2`) render correctly
- [ ] **Device shape** in Shot 4's dolly-out stays portrait — never morphs into tablet/laptop
- [ ] **3 chips** in Shot 3 burst simultaneously, each in its own color (emerald / sky / green)
- [ ] **Color/lighting** consistent across all 4 shots (same emerald edge glow, same particle haze)
- [ ] **File size ≤ 4 MB** after web encode
- [ ] **Mobile autoplay works** (no audio, h.264, faststart)

---

## If multi-shot @Elements still doesn't lock UI fidelity

Fallback: regenerate just the offending shot as a single image-to-video job (the v2 approach) using the two adjacent Elements as start+end frames. Splice that one clip in via ffmpeg. Reserve as a last resort.

---

## Source files

- Demo pages (still useful as references): `app/app/[locale]/demo/hero/{01-orb,02-transcript,03-soap,04-prescription}/page.tsx`
- Source screenshots: `/tmp/larinova-demo-shots/`
- Proxy bypass for `/demo/*`: `app/proxy.ts`
- Landing video slot: `landing/src/components/HeroIndia.tsx` (already accepts `/videos/hero-loop.mp4`)

---

## Variant — Seedance 2.0 (single-prompt, single-take alternative)

If Kling multi-shot keeps drifting on UI fidelity or device shape, try **Seedance 2.0** — ByteDance's video model. Single prompt, single take, references uploaded images via `@`. Stronger at coherent flowing motion than Kling, weaker at strict per-shot anchoring.

### Toolbar

- Model: **Seedance 2.0**
- Aspect: **16:9**
- Resolution: **720p** (or 1080p if available — 720p is fine for hero loop, web-encode squashes detail anyway)
- Duration: **10 seconds** (sweet spot for hero loops — avoid 5s rushed, 15s long)
- Upload `frame_1.png`, `frame_2.png`, `frame_3.png`, `frame_4.png` as referenceable images

### Single prompt (paste verbatim)

> A 10-second cinematic loop in one continuous take.
>
> Open at @frame_1: a black smartphone face-up on a polished walnut desk, doctor's hand at the corner, glowing emerald orb on the small phone screen, soft warm clinic light from upper-left.
>
> Camera punches forward through the phone screen — desk and surroundings rush out of frame with motion blur. We pass through the glass and emerge inside the device at @frame_2: a full-frame medical transcript with color-coded DOCTOR (emerald) and PATIENT (amber) speaker pills, Tamil + English text streaming.
>
> Camera locks. Transcript lines compress and slide downward, fading. SOAP section cards (S, O, A, P) slide in from off-screen with 3D parallax, typing cursors revealing each line. The view resolves to @frame_3: a structured SOAP note with a bold diagnosis callout.
>
> SOAP cards collapse inward and morph into a single emerald-glowing prescription card at center. Three notification chips BURST outward simultaneously in graceful arcs — emerald Email to upper-left, sky-blue SMS to upper-right, green WhatsApp to lower-right — each with its own colored particle trail. The frame holds at @frame_4.
>
> Cinematic dolly-out: camera retreats from inside the phone, back through the glass screen. Chips and prescription dissolve. The device must remain a portrait black smartphone throughout — never a tablet, never a laptop, aspect always portrait, only the size grows from invisible to a small phone resting on the desk. End matching @frame_1 exactly: phone face-up on walnut desk, hand at corner, glowing emerald orb. Seamless circular loop.

### Why Seedance vs Kling

| | Kling 3.0 (multi-shot) | Seedance 2.0 (single-prompt) |
|---|---|---|
| Strength | Per-shot anchoring via Elements | Coherent flowing motion in one take |
| Color/lighting drift across beats | Possible (shot-to-shot reseeding) | Locked end-to-end |
| Device shape interpolation risk | High at the dolly-out | Lower (continuous take, less reseeding) |
| Fine UI text fidelity | Higher (anchored each shot) | Slightly lower (relies on @-reference strength) |

If Seedance produces a clean continuous take with the loop seam closed, it's a one-and-done. If UI text gets fuzzy mid-flow, fall back to the Kling multi-shot path above or the v2 ffmpeg-stitch path.
