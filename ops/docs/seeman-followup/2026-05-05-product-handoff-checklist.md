# Product Handoff and Testing Checklist

**Date:** 2026-05-05  
**Context:** Follow-up from the Saturday meeting action items.

## Action Item Status

| Action item | Owner | Status on 2026-05-05 | Next action |
|---|---|---|---|
| Complete product changes and testing by tonight | Gabriel | In progress | Confirm exact promised product changes, then run focused tests and browser proof. |
| Hand off product to another team member for evaluation | Gabriel | Blocked on recipient | Need name/contact/channel for handoff. |
| Send integration readiness reference document | Balachandar Seeman | Received as example | Example PDF reviewed and converted into a Larinova-specific readiness structure without claiming the example integration is already built. |
| Create integration readiness document with workflow architecture diagram | Gabriel | Drafted | Review `2026-05-05-hospital-integration-readiness.md`. |
| Create marketing video showing real product workflow and UI | Gabriel | Existing Remotion workspace found | Use existing `ops/media/demo-video/` workspace; capture or reuse real app workflow footage. |
| Deliver integration document and medical certificate company examples | Gabriel | Drafted | Review this packet, then export/share after approval. |
| Send medical certificate company samples and formats | Balachandar Seeman | Partially received | URLs reviewed; request any specific sample PDFs/forms he wants copied. |
| Validate meeting on Monday and reconnect by Tuesday | Balachandar Seeman | Due today | Send concise update once packet is ready. |

## Current Product Evidence

Relevant current code:

- `app/components/documents/SickLeaveCertificateDialog.tsx`
- `app/lib/documents/sick-leave-certificate.ts`
- `app/lib/documents/sick-leave-certificate.test.ts`
- `app/app/api/documents/route.ts`
- `app/app/[locale]/(protected)/documents/page.tsx`

What appears implemented:

- The documents page can open a dedicated sick-leave certificate dialog.
- The dialog asks the doctor to pick a patient first.
- Patient age, gender, and address are surfaced after selection.
- The form collects condition, treatment, leave dates, advice, and remarks.
- The API creates a `medical_certificate` document with `certificate_type: sick_leave`.
- The content builder includes patient details, doctor details, leave duration, and a draft disclaimer.

## Verification Completed on 2026-05-05

- `cd app && pnpm exec vitest run lib/documents/sick-leave-certificate.test.ts` passed.
- `cd app && pnpm build` passed.
- Production browser proof completed on `https://app.larinova.com/in/documents` as `gabriel@larinova.com`.
- Read-only proof: documents loaded, Sick Leave dialog opened, patient dropdown loaded, Balachandar Seeman was selectable, demographic card populated age/gender/address, and the create button remained disabled until required dates were entered.
- Screenshot proof: `/tmp/larinova-seeman-certificate-dialog-proof.png`
- Production mutation intentionally avoided: no certificate was submitted during this proof.

Known gaps before product handoff:

- Need final end-to-end create/preview/print/download proof in a controlled test account or with permission to create and clean up a production test certificate.
- Need confirmation whether the product promise was only sick-leave certificates or a broader certificate library.
- Need verification that doctor profile data is populated correctly in production.
- Need verification that the created certificate is easy to locate from the patient record and documents page.
- Need final language/copy review if this is shown to external evaluators.

## Focused Test Plan

### Local/static checks

- Run certificate unit test:
  - `cd app && pnpm exec vitest run lib/documents/sick-leave-certificate.test.ts`
- Run production build if time permits:
  - `cd app && pnpm build`

### Browser proof

Use saved production/dev session through Playwright CLI, not a manual browser handoff.

Checklist:

- Open `/in/documents`.
- Click `Create Medical Certificate` or trigger from Helena document type.
- Confirm patient dropdown loads.
- Select a patient.
- Confirm demographic card appears.
- Fill condition and treatment.
- Pick start/end dates using the app DatePicker.
- Create certificate.
- Confirm certificate appears in the medical certificate list.
- Open detail/preview.
- Confirm print/download layout is readable.
- Repeat at mobile width for dialog and preview.

### Handoff proof

Before handing off to another evaluator, package:

- Live app URL.
- Test doctor account or invite flow instructions.
- What to evaluate.
- Known limitations.
- Feedback questions.

## Product Handoff Note

Use this as the short handoff:

> I have prepared Larinova for evaluation around the OPD document workflow. The key area to review is medical certificate generation inside the authenticated doctor workflow: select patient, create certificate, review generated output, and confirm whether this feels faster and safer than standalone certificate tools. Current known limitation: the sick-leave certificate path is implemented first; the broader certificate library and verification/signature layer are the next product additions.

## Questions That Actually Matter

1. Who is the team member for product handoff, and should the handoff be by WhatsApp, email, or live demo?
2. Were the promised product changes specifically the medical certificate flow, or were there other app changes discussed on Saturday?
3. Should today's marketing video be a fast product walkthrough with real UI, or a polished promo with voiceover and motion graphics?
