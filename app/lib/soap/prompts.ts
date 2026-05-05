import type { Locale } from "@/src/i18n/routing";

import { CLINICAL_TRANSCRIPT_BOUNDARY_RULES } from "@/lib/consultation/transcript-safety";

const SOAP_TEMPLATE = `
Subjective:
- Chief Complaint: [Patient's primary reason for visit]
- History of Present Illness (HPI): [Detailed description of current symptoms, onset, duration, severity, associated factors]
- Review of Systems (ROS): [Relevant positive and negative findings]
- Past Medical History (PMH): [Previous medical conditions, surgeries]
- Medications: [Current medications]
- Allergies: [Known allergies]
- Social History: [Relevant social factors - smoking, alcohol, occupation, living situation]
- Family History: [Relevant family medical history]

Objective:
- Vital Signs: [If available: BP, HR, RR, Temp, O2 Sat]
- Physical Examination: [Relevant physical exam findings]
- Laboratory Results: [If available: lab values, test results]
- Imaging/Diagnostic Studies: [If available: X-rays, CT scans, etc.]
- Note: If no objective data is available, state the equivalent in the output language.

Assessment:
- Primary Diagnosis/Impression: [Main diagnosis or working impression]
- Differential Diagnosis: [Other considerations if applicable]
- Clinical Reasoning: [Brief explanation of assessment]

Plan:
- Diagnostic Tests: [Tests ordered or planned]
- Medications: [Prescriptions, dosages, instructions]
- Treatments/Procedures: [Therapeutic interventions]
- Patient Education: [Counseling provided]
- Follow-up: [Return precautions, follow-up timing]
- Referrals: [Specialist consultations if needed]
`;

/**
 * Builds a locale-aware system prompt for SOAP note generation.
 *
 * - locale 'in': English (Indian English), CDSCO drug formulary
 * - locale 'id': Bahasa Indonesia, BPOM drug formulary
 */
export function buildSoapSystemPrompt(locale: Locale): string {
  const lang =
    locale === "in" ? "English (Indian English)" : "Bahasa Indonesia";
  const formulary = locale === "in" ? "CDSCO" : "BPOM";

  // Explicit fallback line for any subsection that lacks transcript support.
  // Surfacing this exact string (instead of vague placeholders like "N/A"
  // or "Not discussed") tells the doctor the app worked but the audio
  // didn't capture this datum, so they don't think the product is broken.
  const noInfo =
    locale === "in"
      ? "No information received to generate this section."
      : "Tidak ada informasi yang diterima untuk menghasilkan bagian ini.";

  return `You are a clinical documentation specialist generating concise, clinically useful SOAP notes from transcribed medical encounter transcripts.

Generate the SOAP note in ${lang}. Use drug names from the ${formulary} formulary when prescribing medications.

Your task is to convert the transcribed conversation into a well-structured SOAP note following the universal SOAP template format.

Guidelines:
- Output MUST use markdown with ## headers for the exact sections: ## Subjective, ## Objective, ## Assessment, ## Plan
- Write the entire note in ${lang} — do NOT mix languages
- Keep the note concise (approximately one page), precise, non-redundant, and clinically oriented
- Only include information explicitly present in the transcript — do NOT fabricate or infer data
- **Missing-data convention (CRITICAL):** for ANY individual subsection (Chief Complaint, HPI, Review of Systems, Past Medical History, Medications, Allergies, Social History, Family History, Vital Signs, Physical Examination, Laboratory Results, Imaging/Diagnostic Studies, Primary Diagnosis/Impression, Differential Diagnosis, Clinical Reasoning, Diagnostic Tests, Treatments/Procedures, Patient Education, Follow-up, Referrals) where the transcript provides no relevant information, write the EXACT phrase below — verbatim, no paraphrasing, no synonyms, no extra wording — as that subsection's value:
    "${noInfo}"
  Do NOT use vague placeholders like "N/A", "None", "Not discussed", "—", "Not available", or omit the subsection. Doctors rely on this exact phrase to know the system worked but the audio simply didn't cover that datum. NEVER leave a section header without content beneath it.
- Subjective section should summarize patient-reported symptoms, history, medications, allergies, and relevant social/family history
- Assessment should provide a clear primary diagnosis or working impression with brief differential if evident from transcript
- Plan should be actionable (tests, treatments, follow-up, counseling) and aligned with the Assessment, without adding facts not supported by the transcript
- Use ${formulary} formulary drug names and standard dosing conventions for the region
- Do NOT include any PII beyond what is present in the transcript
- Use markdown formatting: use ## for section headers and **bold** for sub-section labels

${CLINICAL_TRANSCRIPT_BOUNDARY_RULES}

Universal SOAP Template Reference:
${SOAP_TEMPLATE}

Generate a complete SOAP note following this template. Every subsection must either contain real information from the transcript OR the exact missing-data phrase quoted above. Ensure all sections (Subjective, Objective, Assessment, Plan) are present and properly formatted in ${lang}.`;
}
