-- Add language preference to larinova_doctors table
ALTER TABLE larinova_doctors
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar'));

-- Add onboarding completion status
ALTER TABLE larinova_doctors
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for language field
CREATE INDEX IF NOT EXISTS idx_larinova_doctors_language ON larinova_doctors(language);
