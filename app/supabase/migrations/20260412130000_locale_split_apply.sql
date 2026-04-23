BEGIN;

-- Re-apply locale split (forward migration, safe to run after rollback)
-- Rename language → locale on larinova_doctors
ALTER TABLE larinova_doctors RENAME COLUMN language TO locale;

-- Backfill everyone to 'in' (current user base is India)
UPDATE larinova_doctors
  SET locale = 'in'
  WHERE locale IS NULL OR locale NOT IN ('in', 'id');

-- Constrain values
ALTER TABLE larinova_doctors
  ADD CONSTRAINT larinova_doctors_locale_valid
  CHECK (locale IN ('in', 'id'));

-- Require non-null with default
ALTER TABLE larinova_doctors ALTER COLUMN locale SET NOT NULL;
ALTER TABLE larinova_doctors ALTER COLUMN locale SET DEFAULT 'in';

-- Add soap_note_locale to consultations (idempotent)
ALTER TABLE larinova_consultations
  ADD COLUMN IF NOT EXISTS soap_note_locale TEXT
  CHECK (soap_note_locale IS NULL OR soap_note_locale IN ('in', 'id'));

-- Backfill existing SOAP notes to 'in'
UPDATE larinova_consultations
  SET soap_note_locale = 'in'
  WHERE soap_note IS NOT NULL AND soap_note_locale IS NULL;

COMMIT;
