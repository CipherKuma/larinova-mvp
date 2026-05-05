export const CLINICAL_TRANSCRIPT_BOUNDARY_RULES = `Patient-boundary rules:
- Treat the selected consultation and linked patient as the only patient record being documented.
- If the transcript contains staff interruptions, nurse logistics, phone calls, background speech, or discussion about a different patient, do not use that text to diagnose, prescribe, summarize symptoms, or create a plan for the current patient.
- If an interruption may be clinically relevant but the patient identity is unclear, flag it only as "Potential unrelated audio for doctor review" instead of merging it into the current patient's clinical facts.
- Never transfer medicines, symptoms, diagnoses, allergies, or advice from another patient's discussion into the current patient's SOAP note, summary, prescription, certificate, or medical codes.`;

export function withTranscriptBoundaryRules(prompt: string): string {
  return `${prompt}\n\n${CLINICAL_TRANSCRIPT_BOUNDARY_RULES}`;
}
