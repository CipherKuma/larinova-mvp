export interface PrescriptionMedicine {
  name: string;
  frequency: string;
  duration: string;
  timing: string;
}

export interface PrescriptionData {
  patient_name: string;
  patient_sex: string;
  patient_age: string;
  medicines: PrescriptionMedicine[];
}

const COMMON_DRUG_PATTERN =
  /\b(paracetamol|acetaminophen|dolo|crocin|ibuprofen|amoxicillin|azithromycin|cetirizine|levocetirizine|pantoprazole|omeprazole|rabeprazole|metformin|insulin|salbutamol|montelukast|atorvastatin|amlodipine|losartan|telmisartan|doxycycline|cefexime|cefixime|cefuroxime)\b/i;

const BRANDED_DOSE_PATTERN = /\b[a-z][a-z0-9-]{2,}\s*\d{2,4}\b/i;
const DOSAGE_UNIT_PATTERN = /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units)\b/i;
const FREQUENCY_PATTERN =
  /\b(?:once|twice|thrice|daily|bd|od|tds|qid|hs|morning|night|after food|before food|1-0-1|1-1-1|0-0-1|3x1|2x1)\b/i;

const COMMON_NAME_STOPWORDS = new Set([
  "tablet",
  "tab",
  "capsule",
  "cap",
  "syrup",
  "injection",
  "drops",
  "ointment",
  "cream",
  "spray",
  "mg",
  "mcg",
  "ml",
  "iu",
  "units",
]);

export function getEmptyPrescription(locale?: string): PrescriptionData {
  const isIndonesia = locale === "id";
  return {
    patient_name: isIndonesia ? "Siti Rahayu" : "Ravi Kumar",
    patient_sex: isIndonesia ? "F" : "M",
    patient_age: "45",
    medicines: [],
  };
}

export function sourceTextForPrescription(
  soapNote?: Record<string, string> | null,
  transcript?: string | null,
): string {
  return [soapNote ? JSON.stringify(soapNote) : "", transcript ?? ""]
    .join("\n")
    .trim();
}

export function hasExplicitMedicineMention(sourceText: string): boolean {
  if (!sourceText.trim()) return false;
  return (
    COMMON_DRUG_PATTERN.test(sourceText) ||
    BRANDED_DOSE_PATTERN.test(sourceText) ||
    DOSAGE_UNIT_PATTERN.test(sourceText) ||
    FREQUENCY_PATTERN.test(sourceText)
  );
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function medicineNameAppearsInSource(
  medicine: PrescriptionMedicine,
  sourceText: string,
): boolean {
  const normalizedSource = ` ${normalizeText(sourceText)} `;
  const tokens = normalizeText(medicine.name)
    .split(" ")
    .filter(
      (token) =>
        token.length >= 3 &&
        !/^\d+$/.test(token) &&
        !COMMON_NAME_STOPWORDS.has(token),
    );

  return tokens.some((token) => normalizedSource.includes(` ${token} `));
}

export function sanitizePrescriptionDemo(
  prescription: PrescriptionData,
  sourceText: string,
  locale?: string,
): PrescriptionData {
  const fallback = getEmptyPrescription(locale);
  const sourceHasMedicine = hasExplicitMedicineMention(sourceText);
  const medicines = sourceHasMedicine
    ? (prescription.medicines ?? []).filter((medicine) => {
        return (
          medicine.name?.trim() &&
          medicineNameAppearsInSource(medicine, sourceText)
        );
      })
    : [];

  return {
    patient_name: prescription.patient_name || fallback.patient_name,
    patient_sex: prescription.patient_sex || fallback.patient_sex,
    patient_age: prescription.patient_age || fallback.patient_age,
    medicines,
  };
}

export function buildPrescriptionDemoPrompt(input: {
  soapNote?: Record<string, string> | null;
  transcript?: string | null;
  locale?: string;
}): string {
  const isIndonesia = input.locale === "id";
  const fallback = getEmptyPrescription(input.locale);

  return `You are a medical prescription assistant. Generate a demo prescription from the SOAP note and consultation transcript below.

IMPORTANT RULES:
1. Extract the patient's name from the transcript if mentioned. If no name is found, use "${fallback.patient_name}" as the default.
2. Determine the patient's sex from explicit context only. Default to "${fallback.patient_sex}" if unclear.
3. Determine the patient's age from explicit context only. Default to "${fallback.patient_age}" if not mentioned.
4. Do NOT infer medicines from diagnosis, symptoms, or assessment.
5. Include a medicine ONLY when the source text explicitly states a medicine or drug name.
6. If no medicine is explicitly stated, return "medicines": [].
7. Do not add substitute drugs. If the source says "Crocin", do not output "Paracetamol" unless "Paracetamol" is also explicitly stated.
8. Each included medicine must have: name, frequency, duration, and timing. If a detail was not stated, leave that field as an empty string.
9. ${isIndonesia ? 'Use Indonesian frequency/timing only when stated, such as "3x1" or "Sesudah makan".' : 'Use Indian frequency/timing only when stated, such as "1-0-1" or "After food".'}

Return ONLY a valid JSON object with this exact structure:
{
  "patient_name": "Name Here",
  "patient_sex": "M" or "F",
  "patient_age": "45",
  "medicines": [
    {
      "name": "EXPLICITLY STATED DRUG NAME",
      "frequency": "frequency if stated, else empty string",
      "duration": "duration if stated, else empty string",
      "timing": "timing if stated, else empty string"
    }
  ]
}

SOAP Note:
${input.soapNote ? JSON.stringify(input.soapNote) : "Not available"}

Consultation Transcript:
${input.transcript || "Not available"}`;
}
