# Hero Loop Video — Higgsfield Prompt Sheet

**Date:** 2026-04-27
**Goal:** Generate a 10-second seamlessly-looping cinematic hero video for `larinova.com` showing a doctor's phone on a desk cycling through the OPD product flow (recording → transcript → SOAP → prescription → back to recording).

## Quick reference (paste-ready)

> Toolbar settings (already configured in Higgsfield UI — **do NOT include in prompt text**): model = Nano Banana Pro, aspect = 16:9, quality = 4K, variations = 1, "Unlimited" on.

| Frame | Reference image | Prompt |
|---|---|---|
| 1 | `01-orb.png` | [IMAGE 1 prompt](#image-1--recording-orb-still) |
| 2 | `02-transcript.png` | [IMAGE 2 prompt](#image-2--live-transcript-still) |
| 3 | `03-soap.png` | [IMAGE 3 prompt](#image-3--soap-note-still) |
| 4 | `04-prescription.png` | [IMAGE 4 prompt](#image-4--prescription--chips-still) |

Source screenshots already captured: `/tmp/larinova-demo-shots/{01-orb,02-transcript,03-soap,04-prescription}.png`

---

## Pipeline

```
1. Static demo pages       2. Browser screenshot       3. Higgsfield IMAGE       4. Higgsfield VIDEO         5. Stitch
   /in/demo/hero/01-orb       430×932 PNG                 cinematic still           Kling 3.0 image-to-video    ffmpeg concat
   /in/demo/hero/02-trans     (already captured           (phone embedded in        4 × 2.5s clips              = 10s loop
   /in/demo/hero/03-soap      to /tmp/larinova-           walnut desk scene)        with start+end frames       hero-loop.mp4
   /in/demo/hero/04-rx        demo-shots/)
```

**Loop seam:** Frame 4 → Frame 1 closes the loop invisibly because the camera is locked and the master scene is identical across all 4 stills.

**Camera decision:** **Single locked angle** for the entire loop. Multi-shot here means "stitch 4 segments at the same angle" (because Kling caps at ~5s per generation), not "change camera positions." A subtle 3% breathing zoom (in over 5s, back out by 10s) adds organic life without breaking the locked feel.

---

## Stage 1 — Cinematic stills (Higgsfield IMAGE)

For each prompt below: paste the prompt text + upload the corresponding screenshot as the **reference image**. Do NOT mention model / aspect / resolution in the prompt — those are toolbar settings.

### MASTER_SCENE — used at the start of every image prompt

Keep this string identical across all 4 stills. The desk + lighting must not change between frames or the loop seam will be visible.

> *"Cinematic close-up of a modern matte-black smartphone, face-up, perfectly centered slightly above the lower third of the frame, lying on a polished walnut desk with a faint warm grain. Soft warm key light from upper-left at 3000K, like late-afternoon sun through clinic blinds. A faint reflection of the phone in the desk surface. Out-of-focus background context: edge of a stethoscope at upper-left, hint of a prescription pad upper-right, all heavily blurred at f/1.8. A doctor's hand at the bottom-right corner of the frame, fingers relaxed, brown skin tone. Subtle 35mm anamorphic film grain, premium product-film aesthetic. The phone occupies roughly 30% of the frame width. No camera tilt — perfectly level."*

### IMAGE 1 — Recording orb still

- **Reference image:** `01-orb.png`
- **Prompt:**

> {{MASTER_SCENE}}. The phone screen displays the reference image exactly: a deep blue-black UI with a glowing emerald-green spinning orb in the center, "00:42" timer below, "Listening · Arun Pillai" caption, a "REC · 00:42" pill in the top-left, and a "Tamil + English · Sarvam AI" pill at the bottom. The orb's emerald glow softly illuminates the surrounding desk surface with a green ambient bounce. Hyper-detailed, the screen is the brightest object in the frame.

### IMAGE 2 — Live transcript still

- **Reference image:** `02-transcript.png`
- **Prompt:**

> {{MASTER_SCENE}}. The phone screen displays the reference image exactly: a "Live transcript" header with a pulsing green dot, a patient strip showing "Arun Pillai · 52 · M" with a "T2DM follow-up" badge, four conversation lines with color-coded DOCTOR (emerald) and PATIENT (amber) speaker pills, mixing Tamil and English text, faint timestamps in monospace on the left. A typing cursor blinks at the latest line. The screen has a subtle cool emerald cast that bounces faintly onto the desk. Every line legible.

### IMAGE 3 — SOAP note still

- **Reference image:** `03-soap.png`
- **Prompt:**

> {{MASTER_SCENE}}. The phone screen displays the reference image exactly: a "Consult notes" top bar, a "SOAP generated" sparkle banner, a diagnosis callout reading "Type 2 Diabetes Mellitus with diabetic peripheral neuropathy / E11.42", and four labeled SOAP section cards (S=emerald, O=sky blue, A=amber, P=violet) with clinical findings populated. A sticky emerald "Approve & generate prescription" button glows at the bottom. Premium clinical UI, every word legible.

### IMAGE 4 — Prescription + chips still

- **Reference image:** `04-prescription.png`
- **Prompt:**

> {{MASTER_SCENE}}. The phone screen displays the reference image exactly: a prescription card with emerald-glow border and "Active" badge, "RX-2026-0001" header, patient/doctor grid (Arun Pillai / Dr. Gabriel Antony), and two medication cards (Metformin SR 1000mg, Pregabalin 75mg). Three small floating notification chips arc out above the prescription card — a brightly-glowing "Email sent" chip on the left, a faded "SMS · Soon" chip in the center, and a faded "WhatsApp · Soon" chip on the right. Each chip has a soft emerald particle trail. The phone screen glows brighter than the previous frames. Sense of magical completion.

### Iteration tip

Generate **Image 1 first** before committing to the full set. If the master scene gives you the look you want (walnut desk, warm light, cinematic), regenerate Images 2–4 with the same scene. If not, iterate the master scene description once and re-spin all 4. **80% of the look depends on getting the master scene right.**

---

## Stage 2 — Video clips (Higgsfield VIDEO)

> Toolbar settings (already configured in Higgsfield UI — **do NOT include in prompt text**): model = Kling 3.0 (image-to-video, start + end frame), duration = 2.5s, aspect = 16:9, resolution = 1080p.

For each clip, upload TWO frames: a **start image** (Stage-1 still) and an **end image** (next Stage-1 still). The prompt describes ONLY what happens INSIDE the phone screen.

### CLIP A — Frame 1 → Frame 2 (orb morphs into transcript)

- **Start frame:** Image 1 (orb still)
- **End frame:** Image 2 (transcript still)
- **Prompt:**

> Static locked camera, no movement, no parallax. The phone screen content morphs smoothly via a liquid-glass dissolve: the centered emerald orb shrinks toward the upper-left corner and becomes a small pulsing dot, while live transcript lines fade in from the bottom of the screen, scrolling upward. Color-coded DOCTOR and PATIENT speaker pills appear with each line. The desk, lighting, hand, and out-of-focus background remain perfectly unchanged. Subtle 3% breathing zoom in. 24fps, no harsh transitions.

### CLIP B — Frame 2 → Frame 3 (transcript morphs into SOAP)

- **Start frame:** Image 2 (transcript still)
- **End frame:** Image 3 (SOAP still)
- **Prompt:**

> Static locked camera. The phone screen content morphs: transcript lines compress and fade into the bottom 20% of the screen, while a structured SOAP note assembles itself from the top — section headers "S", "O", "A", "P" each appear with a typing cursor revealing each line in sequence. The diagnosis "Type 2 Diabetes Mellitus" appears in slightly larger text. A small AI sparkle icon glows. Surrounding desk, lighting, hand, and background remain perfectly unchanged. Continued 3% breathing zoom in.

### CLIP C — Frame 3 → Frame 4 (SOAP morphs into prescription + chips fly out)

- **Start frame:** Image 3 (SOAP still)
- **End frame:** Image 4 (prescription + chips still)
- **Prompt:**

> Static locked camera. The phone screen content morphs: the SOAP note compresses into a small card in the upper area. From the bottom, a clean prescription card slides up — patient name "Arun Pillai" and two medications (Metformin SR, Pregabalin) populate. Three small chip-shaped notification icons emerge from the prescription card in a graceful upward arc — an emerald "Email sent" chip leftmost (brightest), an "SMS · Soon" chip in the center (medium), a green "WhatsApp · Soon" chip on the right (dimmer). Each chip leaves a soft emerald particle trail. The phone screen glows progressively brighter. Surrounding desk, lighting, hand unchanged. Breathing zoom reaches its peak (~3% in) and begins to retract. Magical, photorealistic.

### CLIP D — Frame 4 → Frame 1 (loop closure: chips collapse, orb returns)

- **Start frame:** Image 4 (prescription + chips still)
- **End frame:** Image 1 (orb still — same as Clip A's start frame)
- **Prompt:**

> Static locked camera. The phone screen content morphs to close the loop: the three notification chips and their particle trails gracefully retract back into the prescription card, which collapses and dissolves into the screen center. From that center, the original glowing emerald-green recording orb re-emerges, pulsing softly. The "00:42 Listening · Arun Pillai" text fades back in. The final frame composition is identical to the very first frame — same orb, same timer, same lighting, same hand position. Breathing zoom completes its return to baseline. Seamless circular continuity, no abrupt cut at the loop seam.

---

## Stage 3 — Stitch the loop

Once you have 4 × 2.5s `.mp4` clips downloaded from Higgsfield:

```bash
mkdir -p /tmp/hero-clips
cd /tmp/hero-clips
# Place your downloaded files here:
#   clip-A.mp4  (orb → transcript)
#   clip-B.mp4  (transcript → SOAP)
#   clip-C.mp4  (SOAP → prescription)
#   clip-D.mp4  (prescription → orb)

cat > list.txt <<EOF
file 'clip-A.mp4'
file 'clip-B.mp4'
file 'clip-C.mp4'
file 'clip-D.mp4'
EOF

# 1) Concatenate without re-encoding
ffmpeg -f concat -safe 0 -i list.txt -c copy hero-loop.mp4

# 2) Optimise for web — strip audio, h.264 + faststart
ffmpeg -i hero-loop.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -movflags +faststart \
  -an \
  hero-loop-web.mp4

ls -lh hero-loop-web.mp4
```

Drop the final `hero-loop-web.mp4` into `landing/public/videos/hero-loop.mp4`.

---

## Quality checklist before shipping the loop

- [ ] All 4 stills share the same desk grain, hand position, and lighting (loop seam must be invisible)
- [ ] Phone screen content is legible in every frame — no AI hallucinations of fake medical text
- [ ] Tamil characters (வணக்கம், கோல்) render correctly and aren't replaced by garble
- [ ] Loop plays 5x in a row — at no point does the viewer notice the seam
- [ ] File size ≤ 4 MB (with Stage 3 step 2)
- [ ] Mobile autoplay works (no audio track, h.264, faststart)

---

## Indonesia variant (deferred)

Same 4 stills + 4 clips, but Frame 2's transcript text shifts to Bahasa + English instead of Tamil + English. Reuses Stage 1's master scene unchanged. Defer until India version is shipped.

---

## Source files

- Demo pages: `app/app/[locale]/demo/hero/{01-orb,02-transcript,03-soap,04-prescription}/page.tsx`
- Demo layout (no auth, no chrome): `app/app/[locale]/demo/layout.tsx`
- Proxy bypass for `/demo/*`: `app/proxy.ts`
- Source screenshots: `/tmp/larinova-demo-shots/`
