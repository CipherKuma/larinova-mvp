-- Doctor registration fields needed for India OPD prescription rendering.
-- These were applied manually to brains via app/scripts/migrations/india-pilot.sql
-- but never landed in a proper migration. Formalising them now.

ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS phone_number          TEXT,
  ADD COLUMN IF NOT EXISTS degrees               TEXT,
  ADD COLUMN IF NOT EXISTS registration_number   TEXT,
  ADD COLUMN IF NOT EXISTS registration_council  TEXT;
