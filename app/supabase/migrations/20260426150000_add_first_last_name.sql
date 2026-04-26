-- Split full_name into first_name + last_name so the doctor's name is
-- captured correctly at signup (not inferred from gmail prefix). full_name
-- stays for downstream consumers (prescription PDF, wellness agent,
-- issue-filed email) and is auto-maintained from the two new columns.

ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT;

-- Backfill: split existing full_name on first whitespace.
UPDATE larinova_doctors
SET
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name  = COALESCE(
    last_name,
    NULLIF(trim(substring(full_name from position(' ' in full_name) + 1)), '')
  )
WHERE full_name IS NOT NULL;

-- Trigger to keep full_name in sync with first_name + last_name. Only
-- runs when first_name or last_name actually changed, so manual edits to
-- full_name (back-compat path) still work.
CREATE OR REPLACE FUNCTION larinova_doctors_sync_full_name()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (NEW.first_name IS DISTINCT FROM OLD.first_name) OR
     (NEW.last_name  IS DISTINCT FROM OLD.last_name)
  THEN
    NEW.full_name := trim(coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, ''));
    IF NEW.full_name = '' THEN NEW.full_name := NULL; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_larinova_doctors_sync_full_name ON larinova_doctors;
CREATE TRIGGER trg_larinova_doctors_sync_full_name
  BEFORE INSERT OR UPDATE ON larinova_doctors
  FOR EACH ROW EXECUTE FUNCTION larinova_doctors_sync_full_name();
