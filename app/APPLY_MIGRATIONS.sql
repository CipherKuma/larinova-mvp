-- =============================================================================
-- Larinova - Database Migrations for Language and Onboarding Features
-- =============================================================================
-- Run these migrations IN ORDER in your Supabase SQL Editor
-- =============================================================================

-- MIGRATION 1: Add language and onboarding_completed columns
-- =============================================================================
ALTER TABLE larinova_doctors
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar'));

ALTER TABLE larinova_doctors
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_larinova_doctors_language ON larinova_doctors(language);

-- =============================================================================
-- MIGRATION 2: Update create_doctor_profile function
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_doctor_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_specialization TEXT DEFAULT 'Not Specified',
  p_license_number TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_onboarding_completed BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- Insert the doctor profile with new fields
  INSERT INTO larinova_doctors (
    user_id,
    email,
    full_name,
    specialization,
    license_number,
    language,
    onboarding_completed
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_specialization,
    p_license_number,
    p_language,
    p_onboarding_completed
  )
  RETURNING id INTO v_doctor_id;

  RETURN v_doctor_id;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_doctor_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_doctor_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;

-- =============================================================================
-- MIGRATION 3: Update existing doctor records with default values
-- =============================================================================
-- This ensures existing doctors have the new fields populated
-- They will be marked as having completed onboarding (since they signed up before this feature)
UPDATE larinova_doctors
SET
  language = COALESCE(language, 'en'),
  onboarding_completed = COALESCE(onboarding_completed, TRUE)
WHERE language IS NULL OR onboarding_completed IS NULL;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the migrations worked correctly:

-- Check if columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'larinova_doctors'
  AND column_name IN ('language', 'onboarding_completed');

-- Check existing doctor records
SELECT id, email, full_name, specialization, language, onboarding_completed
FROM larinova_doctors
LIMIT 5;

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
-- CAUTION: Only run this if you need to undo the migrations

/*
-- Remove the new columns
ALTER TABLE larinova_doctors DROP COLUMN IF EXISTS language;
ALTER TABLE larinova_doctors DROP COLUMN IF EXISTS onboarding_completed;

-- Drop the index
DROP INDEX IF EXISTS idx_larinova_doctors_language;

-- Restore old function signature (optional)
CREATE OR REPLACE FUNCTION public.create_doctor_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_specialization TEXT,
  p_license_number TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  INSERT INTO larinova_doctors (
    user_id,
    email,
    full_name,
    specialization,
    license_number
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_specialization,
    p_license_number
  )
  RETURNING id INTO v_doctor_id;

  RETURN v_doctor_id;
END;
$$;
*/

-- ============================================================
-- Calendar & Booking Feature Migration (2026-04-12)
-- ============================================================

-- Add columns to larinova_doctors
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS booking_handle TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS video_call_link TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'IN' CHECK (region IN ('IN', 'ID'));

-- Update existing doctors' region based on locale
UPDATE larinova_doctors SET region = 'ID' WHERE locale = 'id';
UPDATE larinova_doctors SET region = 'IN' WHERE locale != 'id' OR locale IS NULL;

-- Weekly availability template
CREATE TABLE IF NOT EXISTS larinova_doctor_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id       UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  break_start     TIME,
  break_end       TIME,
  UNIQUE(doctor_id, day_of_week)
);

-- Booked appointments
CREATE TABLE IF NOT EXISTS larinova_appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id        UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('video', 'in_person')),
  status           TEXT NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  booker_name      TEXT NOT NULL,
  booker_email     TEXT NOT NULL,
  booker_phone     TEXT NOT NULL,
  booker_age       INTEGER NOT NULL,
  booker_gender    TEXT NOT NULL
                     CHECK (booker_gender IN ('male','female','other','prefer_not_to_say')),
  reason           TEXT NOT NULL,
  chief_complaint  TEXT NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE larinova_doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_appointments ENABLE ROW LEVEL SECURITY;

-- Availability: doctors manage their own; public can read (needed for booking page API)
CREATE POLICY "doctors_manage_availability" ON larinova_doctor_availability
  FOR ALL USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "public_read_availability" ON larinova_doctor_availability
  FOR SELECT USING (true);

-- Appointments: doctors see their own; public can insert (booking) and read own by id
CREATE POLICY "doctors_view_appointments" ON larinova_appointments
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "doctors_update_appointments" ON larinova_appointments
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "public_insert_appointments" ON larinova_appointments
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- India OPD pilot (Team Tier) — 2026-04-23
-- ============================================================

-- Alpha doctor flags on larinova_doctors
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS is_alpha BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alpha_welcomed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_larinova_doctors_is_alpha
  ON larinova_doctors(is_alpha)
  WHERE is_alpha = true;

-- 2026-04-25: Invite-code system + drop 'whitelisted' subscription status.
-- See: supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql
ALTER TABLE larinova_subscriptions
  DROP CONSTRAINT IF EXISTS larinova_subscriptions_status_check;
ALTER TABLE larinova_subscriptions
  ADD CONSTRAINT larinova_subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'past_due', 'trialing'));
UPDATE larinova_subscriptions SET status = 'active' WHERE status = 'whitelisted';

CREATE TABLE IF NOT EXISTS larinova_invite_codes (
  code         TEXT PRIMARY KEY,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at  TIMESTAMPTZ,
  CONSTRAINT redeemed_pair_consistent
    CHECK ((redeemed_by IS NULL) = (redeemed_at IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_larinova_invite_codes_redeemed_by
  ON larinova_invite_codes (redeemed_by) WHERE redeemed_by IS NOT NULL;
ALTER TABLE larinova_invite_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS invite_code_redeemed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_now        TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := v_now + INTERVAL '30 days';
  v_already    TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT invite_code_redeemed_at INTO v_already
    FROM larinova_doctors WHERE user_id = v_user_id;
  IF v_already IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_redeemed', true);
  END IF;

  PERFORM 1 FROM larinova_invite_codes
   WHERE code = p_code AND redeemed_by IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_code' USING ERRCODE = 'P0001';
  END IF;

  UPDATE larinova_invite_codes
     SET redeemed_by = v_user_id, redeemed_at = v_now
   WHERE code = p_code;

  UPDATE larinova_doctors
     SET invite_code_redeemed_at = v_now
   WHERE user_id = v_user_id;

  INSERT INTO larinova_subscriptions (doctor_id, plan, status, current_period_end)
  SELECT id, 'pro', 'active', v_period_end
    FROM larinova_doctors WHERE user_id = v_user_id
  ON CONFLICT (doctor_id) DO UPDATE
    SET plan = 'pro',
        status = 'active',
        current_period_end = GREATEST(
          larinova_subscriptions.current_period_end,
          EXCLUDED.current_period_end
        );

  RETURN jsonb_build_object('ok', true, 'period_end', v_period_end);
END;
$$;

REVOKE ALL ON FUNCTION redeem_invite_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_invite_code(TEXT) TO authenticated;
