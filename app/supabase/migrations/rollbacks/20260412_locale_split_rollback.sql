BEGIN;

ALTER TABLE larinova_consultations DROP COLUMN IF EXISTS soap_note_locale;

ALTER TABLE larinova_doctors ALTER COLUMN locale DROP DEFAULT;
ALTER TABLE larinova_doctors ALTER COLUMN locale DROP NOT NULL;
ALTER TABLE larinova_doctors DROP CONSTRAINT IF EXISTS larinova_doctors_locale_valid;
ALTER TABLE larinova_doctors RENAME COLUMN locale TO language;

COMMIT;
