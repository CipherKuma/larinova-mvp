BEGIN;

-- Re-apply locale split (forward migration, safe to run after rollback OR after fresh apply)
-- Idempotent: each step guarded so this is a no-op on a clean project where 20260412120000 already ran.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'larinova_doctors' AND column_name = 'language'
  ) THEN
    ALTER TABLE larinova_doctors RENAME COLUMN language TO locale;
  END IF;
END $$;

UPDATE larinova_doctors
  SET locale = 'in'
  WHERE locale IS NULL OR locale NOT IN ('in', 'id');

ALTER TABLE larinova_doctors
  DROP CONSTRAINT IF EXISTS larinova_doctors_locale_valid;
ALTER TABLE larinova_doctors
  ADD CONSTRAINT larinova_doctors_locale_valid
  CHECK (locale IN ('in', 'id'));

ALTER TABLE larinova_doctors ALTER COLUMN locale SET NOT NULL;
ALTER TABLE larinova_doctors ALTER COLUMN locale SET DEFAULT 'in';

ALTER TABLE larinova_consultations
  ADD COLUMN IF NOT EXISTS soap_note_locale TEXT
  CHECK (soap_note_locale IS NULL OR soap_note_locale IN ('in', 'id'));

UPDATE larinova_consultations
  SET soap_note_locale = 'in'
  WHERE soap_note IS NOT NULL AND soap_note_locale IS NULL;

COMMIT;
