BEGIN;

-- 1. Rename language → locale on larinova_doctors
ALTER TABLE larinova_doctors RENAME COLUMN language TO locale;

-- 2. Backfill everyone to 'in' (current user base is India)
UPDATE larinova_doctors
  SET locale = 'in'
  WHERE locale IS NULL OR locale NOT IN ('in', 'id');

-- 3. Constrain values
ALTER TABLE larinova_doctors
  ADD CONSTRAINT larinova_doctors_locale_valid
  CHECK (locale IN ('in', 'id'));

-- 4. Require non-null with default
ALTER TABLE larinova_doctors ALTER COLUMN locale SET NOT NULL;
ALTER TABLE larinova_doctors ALTER COLUMN locale SET DEFAULT 'in';

-- 5. Add soap_note_locale to consultations
ALTER TABLE larinova_consultations
  ADD COLUMN soap_note_locale TEXT
  CHECK (soap_note_locale IS NULL OR soap_note_locale IN ('in', 'id'));

-- 6. Backfill existing SOAP notes to 'in'
UPDATE larinova_consultations
  SET soap_note_locale = 'in'
  WHERE soap_note IS NOT NULL AND soap_note_locale IS NULL;

COMMIT;
