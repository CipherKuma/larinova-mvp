-- ============================================================
-- Calendar & Booking Feature Migration (2026-04-13)
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

-- Availability: doctors manage their own; public can read (for booking page API)
CREATE POLICY "doctors_manage_availability" ON larinova_doctor_availability
  FOR ALL USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "public_read_availability" ON larinova_doctor_availability
  FOR SELECT USING (true);

-- Appointments: doctors see their own; public can insert (booking)
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
