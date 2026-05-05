import { CLINICAL_TRANSCRIPT_BOUNDARY_RULES } from "@/lib/consultation/transcript-safety";
import type { Locale } from "@/src/i18n/routing";

/**
 * Builds a locale-aware SOAP demo prompt for onboarding.
 * Generates JSON SOAP notes in the doctor's language.
 */
export function buildSoapDemoPrompt(locale: Locale): string {
  const isId = locale === "id";
  const lang = isId ? "Bahasa Indonesia" : "English (Indian English)";
  const formulary = isId ? "BPOM" : "CDSCO";
  // Explicit fallback string — surfaced verbatim so doctors know the
  // system worked but the audio simply didn't cover that datum.
  const noInfo = isId
    ? "Tidak ada informasi yang diterima untuk menghasilkan bagian ini."
    : "No information received to generate this section.";

  return `You are a medical documentation assistant. Generate a SOAP note from the following doctor-patient consultation transcript. The transcript may be in ${lang} — generate the SOAP note entirely in ${lang}. Use drug names from the ${formulary} formulary when applicable.

Format your response as JSON with exactly these keys: "subjective", "objective", "assessment", "plan". Each value should be a concise clinical string written in ${lang}.

Rules:
(1) Document only information explicitly stated in the transcript — never invent, assume, or extrapolate clinical findings.
(2) If a section has no relevant information in the transcript, set its value to the EXACT phrase "${noInfo}" — verbatim, no synonyms, no paraphrasing. Do NOT use "N/A", "None", "Not discussed", "—", or any other placeholder. NEVER return an empty string.
(3) Keep language professional and concise, as a clinician would write.
(4) Write the entire JSON response in ${lang} — do NOT mix languages.

${CLINICAL_TRANSCRIPT_BOUNDARY_RULES}`;
}

export function getSoapFallback(locale: Locale) {
  // Used when the AI call fails outright (network error, parse error,
  // etc.). Same explicit phrase so doctors can tell genuine "no audio
  // for that datum" from "the model crashed and we degraded gracefully"
  // — both surface as a clear "no information received" rather than a
  // fabricated medical placeholder.
  const noInfo =
    locale === "id"
      ? "Tidak ada informasi yang diterima untuk menghasilkan bagian ini."
      : "No information received to generate this section.";
  return {
    subjective: noInfo,
    objective: noInfo,
    assessment: noInfo,
    plan: noInfo,
  };
}

// Legacy constant — kept for any imports that haven't migrated yet
export const SOAP_SYSTEM_PROMPT = buildSoapDemoPrompt("in");

export const SOAP_FALLBACK = getSoapFallback("in");
