-- Add SOAP note and medical codes columns to consultations table

ALTER TABLE larinova_consultations
ADD COLUMN IF NOT EXISTS soap_note TEXT,
ADD COLUMN IF NOT EXISTS medical_codes JSONB DEFAULT NULL;

-- Add index for medical codes queries
CREATE INDEX IF NOT EXISTS idx_larinova_consultations_medical_codes ON larinova_consultations USING GIN (medical_codes);

COMMENT ON COLUMN larinova_consultations.soap_note IS 'AI-generated SOAP note from transcriptions';
COMMENT ON COLUMN larinova_consultations.medical_codes IS 'Extracted medical codes (ICD-10, SNOMED, CPT) in JSON format';
