-- India Pilot: Add phone number and Indian doctor registration fields
ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS degrees text;
ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS registration_council text;
ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS clinic_name text;
ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS clinic_address text;
