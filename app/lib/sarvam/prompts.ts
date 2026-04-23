import type { Locale } from "@/src/i18n/routing";

/**
 * Builds a locale-aware SOAP demo prompt for onboarding.
 * Generates JSON SOAP notes in the doctor's language.
 */
export function buildSoapDemoPrompt(locale: Locale): string {
  const isId = locale === "id";
  const lang = isId ? "Bahasa Indonesia" : "English (Indian English)";
  const formulary = isId ? "BPOM" : "CDSCO";
  const notDiscussed = isId
    ? "Tidak dibahas dalam konsultasi ini"
    : "Not discussed in this consultation";

  return `You are a medical documentation assistant. Generate a SOAP note from the following doctor-patient consultation transcript. The transcript may be in ${lang} — generate the SOAP note entirely in ${lang}. Use drug names from the ${formulary} formulary when applicable.

Format your response as JSON with exactly these keys: "subjective", "objective", "assessment", "plan". Each value should be a concise clinical string written in ${lang}.

Rules:
(1) Document only information explicitly stated in the transcript — never invent, assume, or extrapolate clinical findings.
(2) If a section has no relevant information in the transcript, write "${notDiscussed}" for that key — never return an empty string.
(3) Keep language professional and concise, as a clinician would write.
(4) Write the entire JSON response in ${lang} — do NOT mix languages.`;
}

export function getSoapFallback(locale: Locale) {
  if (locale === "id") {
    return {
      subjective: "",
      objective:
        "Tanda vital dalam batas normal. Temuan pemeriksaan fisik akan didokumentasikan selama konsultasi.",
      assessment: "Penilaian menunggu evaluasi klinis lengkap.",
      plan: "1. Evaluasi klinis lengkap\n2. Pemeriksaan penunjang yang relevan\n3. Tindak lanjut sesuai kebutuhan",
    };
  }
  return {
    subjective: "",
    objective:
      "Vitals within normal limits. Physical examination findings to be documented during consultation.",
    assessment: "Assessment pending full clinical evaluation.",
    plan: "1. Complete clinical evaluation\n2. Order relevant investigations\n3. Follow-up as needed",
  };
}

// Legacy constant — kept for any imports that haven't migrated yet
export const SOAP_SYSTEM_PROMPT = buildSoapDemoPrompt("in");

export const SOAP_FALLBACK = getSoapFallback("in");
