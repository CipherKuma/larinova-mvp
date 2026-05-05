# Current Spec

## Goal
Complete the 2026-05-05 Seeman product follow-up by implementing the certificate-product value inside Larinova and fixing/auditing the product bugs found during Saturday testing.

## Decided
- P0 is consultation reliability: a real consultation must not silently stop around one minute, must visibly report recording/transcription state, and must stream transcript text on screen while recording.
- P0 is onboarding/prescription correctness: medicines must not be generated unless explicitly stated in the audio/transcript.
- Product-value target is not just documenting competitor certificate apps; Larinova should absorb their useful value in a doctor-controlled, patient-linked, auditable certificate module.
- Use Balachandar Seeman's hospital integration PDF only as an example/reference for how hospital integration material is structured.
- Preserve unrelated dirty worktree changes.

## Open
- Exact minimum certificate types to ship first beyond sick leave.
- Whether to create a controlled production test certificate for full end-to-end proof or keep production browser testing read-only.
- Browser/polish proof is blocked until the M2 Playwright worker is reachable again.

## Out of scope
- Do not claim HL7/Mirth integration is shipped unless implemented and tested.
- Do not file, contact, or send external communications without Gabriel approval.
- Do not mutate production data without explicit approval or a controlled test-cleanup path.

## Done-when
- Consultation recording/transcription root cause is identified, fixed, and covered by regression checks.
- Onboarding medicine-generation root cause is identified, fixed, and covered by regression checks.
- Certificate module ships a practical first expansion toward the competitor-product value without fake-certificate framing.
- Build/tests pass and browser proof covers the changed user paths.
