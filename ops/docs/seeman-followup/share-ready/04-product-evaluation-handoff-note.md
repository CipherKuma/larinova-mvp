# Larinova Product Evaluation Handoff Note

**Date:** 2026-05-06

## Short Message

Larinova is ready to be evaluated as an OPD workflow product for doctors and clinics. The main review areas are:

1. Consultation workflow.
2. Real-time transcription and clinical note generation.
3. Prescription/document workflow.
4. Medical certificate generation.
5. Future hospital integration path.

## What To Show First

1. Doctor dashboard.
2. Patient record.
3. Consultation recording/transcription.
4. Generated summary/prescription.
5. Medical certificate creation from patient record.
6. Hospital integration architecture document.

## What To Say Clearly

- Larinova is not an anonymous certificate generator.
- Certificates are created inside the authenticated doctor workflow.
- Certificate output follows the expected Indian medical certificate structure more closely now: doctor registration, patient address, patient signature/thumb impression, identification mark, examination date/place, diagnosis/nature of illness, duration, doctor signature/seal area, and retained document record.
- HL7/HIS integration is not claimed as live yet. The architecture and phased pathway are ready for hospital discussion.

## Questions for Evaluator

1. Does this OPD workflow match how doctors currently work?
2. Which part saves the most time: intake, transcription, prescription, certificate, or follow-up?
3. What certificate formats do hospitals/employers usually reject?
4. Does the hospital require digital signature, physical stamp, QR verification, or all three?
5. What integration route does the hospital prefer: REST API, webhooks, HL7, FHIR, or Mirth?

## Known Next Product Work

- Add QR/verification page.
- Add doctor signature/seal upload.
- Add certificate finalization workflow.
- Add document share audit.
- Add hospital integration event schema.
