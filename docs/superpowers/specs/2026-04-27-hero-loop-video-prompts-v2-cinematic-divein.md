
# Hero Loop Video v2 — Cinematic Dive-In Concept

**Date:** 2026-04-27
**Concept:** Camera dives INTO the phone, lives inside the UI for the action, then pulls BACK out. The phone-on-desk is the loop seam (start + end frame). The middle of the loop is full-frame UI — massive, readable, cinematic.

**Why this beats v1:** v1 kept the camera locked on a small phone the whole time, so 70% of every frame was wasted desk and the UI was tiny and unreadable. v2 uses the phone as a *frame* (intro + outro), and explodes the UI to full frame for the catchy middle.

**Replaces:** `2026-04-27-hero-loop-video-prompts.md` (v1, kept for reference)

---

## The arc

```
   t=0s          t=2.5s          t=5.0s             t=7.5s            t=10s
   FRAME 1   →   FRAME 2     →   FRAME 3        →   FRAME 4       →   FRAME 1 (loop seam)
   Phone on  →   Inside UI   →   Inside UI      →   Inside UI     →   Phone on
   desk          (transcript     (SOAP cards        (prescription      desk
   (wide)        full-frame)     floating in        + chips burst      (wide,
                                  3D space)         outward)           same as t=0)
   ─────────────────── camera dolly IN ──────────────────────── camera dolly OUT ─────
```

- **Frame 1** = phone on desk (loop seam, identical at start and end)
- **Frames 2-4** = full-frame UI views (camera is *inside* the device)
- The dolly-in (Clip A) and dolly-out (Clip D) are where the energy comes from

---

## Stage 1 — Cinematic stills (Higgsfield IMAGE)

> Toolbar: Nano Banana Pro, 16:9, 4K. **Do NOT mention these in the prompt.**

### IMAGE 1 — Wide phone on desk (loop seam)

- **Reference image:** `/tmp/larinova-demo-shots/01-orb.png`
- **Prompt:**

> Cinematic close-up of a modern matte-black smartphone, face-up, perfectly centered slightly above the lower third of the frame, lying on a polished walnut desk with a faint warm grain. Soft warm key light from upper-left at 3000K, like late-afternoon sun through clinic blinds. Faint reflection of the phone in the desk surface. Out-of-focus background: edge of a stethoscope at upper-left, hint of a prescription pad upper-right, all heavily blurred at f/1.8. Doctor's hand at the bottom-right corner, fingers relaxed, brown skin tone. The phone screen displays the reference image exactly: a glowing emerald-green spinning orb in the center, "00:42" timer below, "Listening · Arun Pillai" caption. The orb's emerald glow softly illuminates the surrounding desk surface with a green ambient bounce. Subtle 35mm anamorphic film grain. The phone occupies roughly 30% of the frame width.

### IMAGE 2 — Inside the screen, transcript view (full-frame UI)

- **Reference image:** `/tmp/larinova-demo-shots/02-transcript.png`
- **Prompt:**

> A massive cinematic full-frame view of a medical AI live transcript UI, no phone shell visible. We are inside the device. The frame is filled by the UI: a "Live transcript" header with a pulsing green dot at the top, a patient strip showing "Arun Pillai · 52 · M · T2DM follow-up", and four large legible conversation lines with color-coded DOCTOR (emerald) and PATIENT (amber) speaker pills. Tamil and English text mixed, every word readable across a room. A typing cursor blinks at the latest line. The text scale is 4-5x what it would be on a real phone. Background: deep blue-black cinematic space with a subtle emerald glow at the edges, gentle particle haze suggesting depth, faint warm light bleeding in from the left edge as if we just passed through the phone screen surface. Photorealistic, premium product-film aesthetic, 35mm anamorphic feel.

### IMAGE 3 — Inside the screen, SOAP cards floating in 3D

- **Reference image:** `/tmp/larinova-demo-shots/03-soap.png`
- **Prompt:**

> A massive cinematic full-frame view of a medical SOAP note assembling itself, no phone shell visible. We are still inside the device. A bold "Diagnosis: Type 2 Diabetes Mellitus with diabetic peripheral neuropathy / E11.42" callout floats at the top center, slightly larger than the other cards. Four labeled SOAP section cards (S=emerald, O=sky blue, A=amber, P=violet) float behind the diagnosis with subtle 3D parallax depth — each card large enough to read clinical findings clearly. A small AI sparkle icon glows in the corner of the diagnosis card. The cards have soft drop shadows suggesting they hover above a dark cinematic background. Background: same deep blue-black cinematic space as the previous frame, emerald glow at edges, gentle drifting particles, subtle vignette. Premium clinical UI, every word legible, 35mm anamorphic feel.

### IMAGE 4 — Prescription + chips bursting outward, phone shell reforming at edges

- **Reference image:** `/tmp/larinova-demo-shots/04-prescription.png`
- **Prompt:**

> A cinematic full-frame composition: a large emerald-glowing prescription card occupies the center of the frame, displaying "RX-2026-0001 · Active", patient (Arun Pillai), doctor (Dr. Gabriel Antony), and two medication cards (Metformin SR 1000mg, Pregabalin 75mg). Three large floating notification chips BURST outward from the prescription card toward the corners of the frame, all three equally bright and equally "sent" — an emerald-glowing "Email sent" chip toward the upper-left, a sky-blue-glowing "SMS sent" chip toward the upper-right, a green-glowing "WhatsApp sent" chip toward the lower-right. Each chip has its own colored glow halo and trails a long sweeping particle wake in its matching color (emerald, sky, green). AT THE VERY EDGES of the frame, the dark walnut desk surface is just beginning to reappear at the corners, as if the camera is starting to pull back out through the phone screen. The center is bright and magical, the edges are darker and grounded. Sense of climax and completion — every channel delivered.

---

## Stage 2 — Video clips (Higgsfield Kling 3.0)

**Approach:** 4 separate Kling generations (one per clip). Each job uses its own start + end frame pair so Kling never has to imagine intermediate UI — every keyframe is a real reference. Stitch the 4 clips together with ffmpeg in Stage 3.

**Why not multi-shot mode:** Higgsfield's Multi-shot toggle uses ONE global start frame + ONE global end frame for the entire video. The intermediate shots are described by prompt only — Kling has to hallucinate the inside-UI states (transcript text, SOAP labels, prescription details). For a hero loop where every word must be legible and accurate, that's too risky. Path Y trades 4× the credits for full UI fidelity.

**Why not Motion Control:** Higgsfield's Motion Control tab is a motion-transfer feature (copy motion from a reference video onto a character) — not a camera-move preset. Camera direction stays in the prompt text.

> **Toolbar per job (set in Higgsfield Create Video page — DO NOT include in prompt):**
> - Model: Kling 3.0
> - Aspect: 16:9
> - Quality: 4K
> - Multi-shot: **OFF**
> - Start frame: as specified per clip
> - End frame: as specified per clip
> - Per-shot duration: 2.5s (or 3s if 2.5s isn't selectable)

**Cost:** ~18 credits per generation × 4 clips = ~72 credits total.

For each clip, upload the start frame + end frame as the two anchors.

### CLIP A — Frame 1 → Frame 2 (DOLLY IN: through the screen)

- **Start frame:** Image 1 (phone on desk, wide)
- **End frame:** Image 2 (full-frame transcript UI)
- **Prompt:**

> Cinematic dolly-in. Camera rapidly pushes forward toward the phone screen — the walnut desk, doctor's hand, and out-of-focus clinic surroundings rapidly fall out of frame as we accelerate. We pass through the surface of the phone screen and the small recording orb expands explosively into the foreground, dissolving into a full-frame live transcript UI with color-coded speaker pills and bilingual text. Smooth dramatic acceleration, fluid motion blur on the surroundings during the push, no harsh cut.

### CLIP B — Frame 2 → Frame 3 (UI morph: transcript to SOAP)

- **Start frame:** Image 2 (transcript)
- **End frame:** Image 3 (SOAP cards)
- **Prompt:**

> Camera holds steady inside the cinematic UI space — no movement, just content morphing. Transcript lines compress and slide downward, fading as they go, while structured SOAP section cards (S, O, A, P) slide in with subtle 3D parallax depth from off-screen — each appearing with a typing cursor revealing each line. A bold diagnosis callout settles at the top center. A small AI sparkle icon glows into existence. The dark cinematic background, emerald edge glow, and drifting particles remain unchanged. Continuous, premium.

### CLIP C — Frame 3 → Frame 4 (chips BURST out)

- **Start frame:** Image 3 (SOAP cards)
- **End frame:** Image 4 (prescription + chips bursting)
- **Prompt:**

> Camera holds. The SOAP cards collapse inward and morph into a single emerald-glowing prescription card at center frame. From the prescription card, three large notification chips BURST outward simultaneously in dramatic graceful arcs, all three equally bright and equally "sent" — an emerald "Email sent" chip toward the upper-left, a sky-blue "SMS sent" chip toward the upper-right, a green "WhatsApp sent" chip toward the lower-right. Each chip trails a long sweeping particle wake in its own color (emerald, sky, green). The frame fills with energetic motion and multi-coloured light. Subtle hint of darkness creeping into the corners, suggesting the camera is about to begin pulling back. Magical, climactic, every channel delivered at once.

### CLIP D — Frame 4 → Frame 1 (DOLLY OUT: back through the screen)

- **Start frame:** Image 4 (prescription + chips)
- **End frame:** Image 1 (phone on desk, wide — same as Clip A's start frame)
- **Prompt:**

> Cinematic dolly-out — the camera is exiting from INSIDE a phone, passing back through the glass screen surface to the outside world. The three notification chips (emerald Email, sky-blue SMS, green WhatsApp) and the prescription card collapse inward and dissolve as we retreat, their particle trails retracting toward the center. We pass through the screen surface into the open air above the desk. As the camera continues backward, the device that resolves into view is unambiguously a portrait-oriented black smartphone — same dimensions, same matte-black bezel, same proportions as the opening frame. **Important: the device must be a phone at every stage of the pullback. It must NEVER appear as a tablet, NEVER a laptop, NEVER any landscape device. The aspect of the device stays portrait throughout. The device size simply grows from invisibly small (we're inside it) to a small phone occupying roughly 30% of the frame width on the desk.** The walnut desk, doctor's hand, and clinic background reappear and resolve into focus around the phone. Final frame composition is identical to the opening frame — phone face-up on walnut desk, glowing emerald orb on its small portrait screen, doctor's hand at the bottom-right corner. Smooth deceleration, fluid motion blur on the surroundings during the pullback, seamless circular loop continuity, no abrupt cut at the loop seam.

---

## Stage 3 — Stitch (same as v1)

```bash
mkdir -p /tmp/hero-clips && cd /tmp/hero-clips
# Place clip-A.mp4, clip-B.mp4, clip-C.mp4, clip-D.mp4 here
cat > list.txt <<EOF
file 'clip-A.mp4'
file 'clip-B.mp4'
file 'clip-C.mp4'
file 'clip-D.mp4'
EOF
ffmpeg -f concat -safe 0 -i list.txt -c copy hero-loop.mp4
ffmpeg -i hero-loop.mp4 -c:v libx264 -preset slow -crf 22 -movflags +faststart -an hero-loop-web.mp4
```

Drop into `landing/public/videos/hero-loop.mp4`.

---

## Quality bar before shipping

- [ ] **Loop seam invisible** — frame 1 (start of Clip A) and final frame of Clip D match exactly: same desk grain, same hand position, same orb pose, same lighting
- [ ] **Push-in (Clip A) feels dramatic, not jerky** — smooth acceleration with motion blur, the surroundings should blur as we move
- [ ] **Pull-out (Clip D) decelerates gracefully** — opposite of Clip A, ends gently on the wide frame
- [ ] **Inside frames (2, 3, 4) feel like one connected space** — same dark backdrop, same edge glow, same particle treatment
- [ ] **Tamil characters render** in Frame 2 (வணக்கம் etc.)
- [ ] **All UI text is legible at TV viewing distance** — that's the whole point of the dive-in
- [ ] **File size ≤ 4 MB** after web optimisation
- [ ] **Mobile autoplay works** (no audio, h.264, faststart)

---

## What changed vs v1

| | v1 (locked phone on desk) | v2 (cinematic dive-in) |
|---|---|---|
| Camera | Static, locked on phone | Dollies IN through screen, then OUT |
| UI scale | Tiny — 9pt text on a 30% phone | Massive — fills 16:9 frame for 3 of 4 frames |
| Energy | Contemplative, slow | Dramatic, catchy, premium-keynote |
| Loop seam | Invisible | Invisible (same wide phone-on-desk shot at start + end) |
| Risk | Boring | Push-in must look smooth, not jerky — Kling can struggle with dramatic camera moves |

If Clip A or D look amateur (jerky push-in / pull-out), the fallback is to soften the camera move in the prompt (replace "rapidly" with "smoothly", drop "motion blur" mention).

---

## Source files (unchanged from v1)

- Demo pages: `app/app/[locale]/demo/hero/{01-orb,02-transcript,03-soap,04-prescription}/page.tsx`
- Source screenshots: `/tmp/larinova-demo-shots/`
- Proxy bypass: `app/proxy.ts`
