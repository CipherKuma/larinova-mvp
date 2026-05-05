# Marketing Video Plan

**Date:** 2026-05-05  
**Goal:** Show real Larinova product workflow and UI, not just concept footage.

## Existing Workspace

Use the existing Remotion project:

- Workspace: `ops/media/demo-video/`
- Existing render: `ops/media/demo-video/out/larinova-demo.mp4`
- Existing assets: `ops/media/demo-video/public/assets/`
- Main files: `ops/media/demo-video/src/Composition.tsx`, `ops/media/demo-video/src/Root.tsx`

Skill discovery on 2026-05-05 found external Remotion/promo-video skills, but no install is needed for today because this repo already has a working Remotion workspace and prior Larinova assets.

## Recommended Story

Keep the video product-first and short: 60 to 90 seconds.

### Scene 1: Doctor starts the day

- Show appointments or patient list.
- Message: Larinova brings intake, consult notes, prescriptions, certificates, and follow-up into one OPD workflow.

### Scene 2: Patient record

- Show patient profile and clinical context.
- Message: Patient details are reusable across documents and follow-up.

### Scene 3: Consultation/document workflow

- Show document generation or Helena-assisted document flow.
- Show sick-leave certificate creation from patient record.
- Message: The doctor stays in control; AI prepares, doctor reviews.

### Scene 4: Certificate output

- Show preview or generated certificate.
- Message: Medical certificates should be patient-linked, doctor-reviewed, auditable, and ready to share.

### Scene 5: Integration readiness

- Show simple architecture graphic from product to API/integration gateway/HIS.
- Message: Larinova is built as the clinical workflow layer, with integration gateway next.

### Scene 6: Close

- Show Larinova logo and core positioning:
  - India: "The OPD assistant for Indian doctors."
  - Hospital/clinic version: "From consultation to certified documents and follow-up."

## Footage Checklist

- [ ] App landing/sign-in, only if visually needed.
- [ ] Doctor dashboard or appointments.
- [ ] Patient list/profile.
- [ ] Documents page.
- [ ] Medical certificate creation dialog.
- [ ] Certificate preview.
- [ ] Consultation/SOAP/prescription workflow if stable.
- [ ] Integration architecture slide/animation.

## Voiceover Draft

> Most clinic software stops at storing records. Larinova supports the whole OPD workflow: patient context, consultation notes, prescriptions, medical certificates, and follow-up.  
>  
> A doctor can select the patient, generate a structured certificate from the actual record, review the wording, and keep the final document attached to the patient timeline.  
>  
> This is the direction we are building toward: verified, doctor-controlled documentation inside the workflow, with an integration layer that can connect to clinic systems, hospital HIS, or future HL7/FHIR interfaces.  
>  
> Larinova is not just a scribe. It is the operating layer for modern OPD care.

## Fast Render Plan

1. Browser-capture the real product flow.
2. Replace or add clips in `ops/media/demo-video/public/assets/`.
3. Update Remotion composition with new sequence labels and the architecture slide.
4. Render `ops/media/demo-video/out/larinova-seeman-followup.mp4`.
5. Check audio, text legibility, and mobile-safe framing before sharing.

## Decisions Needed

- Fast walkthrough today, or polished promo?
- English only, or English plus Tamil/Indonesian subtitles?
- Should the video include Seeman/hospital integration framing, or stay doctor/clinic buyer focused?

