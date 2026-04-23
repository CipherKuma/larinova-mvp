-- Larinova MVP Database Migration
-- Complete schema for all tables, indexes, triggers, RLS policies, and seed data

-- ============================================================
-- 1. CREATE TABLES (in order respecting foreign keys)
-- ============================================================

-- Doctors table
CREATE TABLE IF NOT EXISTS larinova_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  specialization TEXT,
  license_number TEXT,
  phone TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_doctors
CREATE INDEX IF NOT EXISTS idx_larinova_doctors_user_id ON larinova_doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_larinova_doctors_email ON larinova_doctors(email);

-- Patients table
CREATE TABLE IF NOT EXISTS larinova_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_by_doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_patients
CREATE INDEX IF NOT EXISTS idx_larinova_patients_email ON larinova_patients(email);
CREATE INDEX IF NOT EXISTS idx_larinova_patients_patient_code ON larinova_patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_larinova_patients_created_by ON larinova_patients(created_by_doctor_id);

-- Insurance table
CREATE TABLE IF NOT EXISTS larinova_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_type TEXT,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_insurance
CREATE INDEX IF NOT EXISTS idx_larinova_insurance_patient_id ON larinova_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_larinova_insurance_active ON larinova_insurance(patient_id, is_active);

-- Health records table
CREATE TABLE IF NOT EXISTS larinova_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'diagnosis',
    'medication',
    'allergy',
    'procedure',
    'lab_result',
    'vaccination',
    'chronic_condition',
    'family_history',
    'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  record_date DATE NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_health_records
CREATE INDEX IF NOT EXISTS idx_larinova_health_records_patient_id ON larinova_health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_larinova_health_records_record_type ON larinova_health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_larinova_health_records_date ON larinova_health_records(record_date DESC);

-- Consultations table
CREATE TABLE IF NOT EXISTS larinova_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  consultation_code TEXT UNIQUE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',
    'completed',
    'cancelled'
  )),
  chief_complaint TEXT,
  diagnosis TEXT,
  summary TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_consultations
CREATE INDEX IF NOT EXISTS idx_larinova_consultations_patient_id ON larinova_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_larinova_consultations_doctor_id ON larinova_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_larinova_consultations_status ON larinova_consultations(status);
CREATE INDEX IF NOT EXISTS idx_larinova_consultations_start_time ON larinova_consultations(start_time DESC);

-- Transcripts table
CREATE TABLE IF NOT EXISTS larinova_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('doctor', 'patient', 'unknown')),
  text TEXT NOT NULL,
  language TEXT,
  confidence FLOAT,
  timestamp_start FLOAT,
  timestamp_end FLOAT,
  assemblyai_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_transcripts
CREATE INDEX IF NOT EXISTS idx_larinova_transcripts_consultation_id ON larinova_transcripts(consultation_id);
CREATE INDEX IF NOT EXISTS idx_larinova_transcripts_speaker ON larinova_transcripts(speaker);
CREATE INDEX IF NOT EXISTS idx_larinova_transcripts_timestamp ON larinova_transcripts(timestamp_start);

-- Medicines table
CREATE TABLE IF NOT EXISTS larinova_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'antibiotic',
    'painkiller',
    'antiviral',
    'antifungal',
    'antihistamine',
    'antacid',
    'antidiabetic',
    'antihypertensive',
    'vitamin',
    'supplement',
    'other'
  )),
  manufacturer TEXT,
  common_dosages JSONB DEFAULT '[]'::jsonb,
  common_frequencies JSONB DEFAULT '[]'::jsonb,
  warnings TEXT,
  is_prescription_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_medicines
CREATE INDEX IF NOT EXISTS idx_larinova_medicines_name ON larinova_medicines(name);
CREATE INDEX IF NOT EXISTS idx_larinova_medicines_category ON larinova_medicines(category);
CREATE INDEX IF NOT EXISTS idx_larinova_medicines_active ON larinova_medicines(is_active);

-- Full-text search index for larinova_medicines
CREATE INDEX IF NOT EXISTS idx_larinova_medicines_search ON larinova_medicines
USING GIN (to_tsvector('english', name || ' ' || COALESCE(generic_name, '')));

-- Prescriptions table
CREATE TABLE IF NOT EXISTS larinova_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  prescription_code TEXT UNIQUE NOT NULL,
  doctor_notes TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for larinova_prescriptions
CREATE INDEX IF NOT EXISTS idx_larinova_prescriptions_consultation_id ON larinova_prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_larinova_prescriptions_patient_id ON larinova_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_larinova_prescriptions_doctor_id ON larinova_prescriptions(doctor_id);

-- Prescription items table
CREATE TABLE IF NOT EXISTS larinova_prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES larinova_prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES larinova_medicines(id) ON DELETE RESTRICT,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for larinova_prescription_items
CREATE INDEX IF NOT EXISTS idx_larinova_prescription_items_prescription_id ON larinova_prescription_items(prescription_id);

-- ============================================================
-- 2. CREATE FUNCTIONS AND TRIGGERS
-- ============================================================

-- Auto-generate patient code
CREATE OR REPLACE FUNCTION generate_patient_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_code FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM larinova_patients
  WHERE patient_code LIKE 'KP-' || year_part || '-%';

  new_code := 'KP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.patient_code := new_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_patient_code ON larinova_patients;
CREATE TRIGGER set_patient_code
BEFORE INSERT ON larinova_patients
FOR EACH ROW
WHEN (NEW.patient_code IS NULL)
EXECUTE FUNCTION generate_patient_code();

-- Auto-generate consultation code
CREATE OR REPLACE FUNCTION generate_consultation_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(consultation_code FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM larinova_consultations
  WHERE consultation_code LIKE 'KC-' || year_part || '-%';

  new_code := 'KC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.consultation_code := new_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_consultation_code ON larinova_consultations;
CREATE TRIGGER set_consultation_code
BEFORE INSERT ON larinova_consultations
FOR EACH ROW
WHEN (NEW.consultation_code IS NULL)
EXECUTE FUNCTION generate_consultation_code();

-- Auto-calculate consultation duration
CREATE OR REPLACE FUNCTION calculate_consultation_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_consultation_duration ON larinova_consultations;
CREATE TRIGGER set_consultation_duration
BEFORE INSERT OR UPDATE ON larinova_consultations
FOR EACH ROW
EXECUTE FUNCTION calculate_consultation_duration();

-- Auto-generate prescription code
CREATE OR REPLACE FUNCTION generate_prescription_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(prescription_code FROM 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM larinova_prescriptions
  WHERE prescription_code LIKE 'KRX-' || year_part || '-%';

  new_code := 'KRX-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.prescription_code := new_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_prescription_code ON larinova_prescriptions;
CREATE TRIGGER set_prescription_code
BEFORE INSERT ON larinova_prescriptions
FOR EACH ROW
WHEN (NEW.prescription_code IS NULL)
EXECUTE FUNCTION generate_prescription_code();

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE larinova_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_prescription_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for larinova_doctors
DROP POLICY IF EXISTS "Doctors can view own profile" ON larinova_doctors;
CREATE POLICY "Doctors can view own profile"
ON larinova_doctors FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can update own profile" ON larinova_doctors;
CREATE POLICY "Doctors can update own profile"
ON larinova_doctors FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for larinova_patients
DROP POLICY IF EXISTS "Doctors can view all patients" ON larinova_patients;
CREATE POLICY "Doctors can view all patients"
ON larinova_patients FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Doctors can insert patients" ON larinova_patients;
CREATE POLICY "Doctors can insert patients"
ON larinova_patients FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Doctors can update patients" ON larinova_patients;
CREATE POLICY "Doctors can update patients"
ON larinova_patients FOR UPDATE
TO authenticated
USING (true);

-- RLS Policies for larinova_medicines
DROP POLICY IF EXISTS "Authenticated users can view medicines" ON larinova_medicines;
CREATE POLICY "Authenticated users can view medicines"
ON larinova_medicines FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for other tables (basic authenticated access)
DROP POLICY IF EXISTS "Authenticated users can view insurance" ON larinova_insurance;
CREATE POLICY "Authenticated users can view insurance"
ON larinova_insurance FOR ALL
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage health records" ON larinova_health_records;
CREATE POLICY "Authenticated users can manage health records"
ON larinova_health_records FOR ALL
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage consultations" ON larinova_consultations;
CREATE POLICY "Authenticated users can manage consultations"
ON larinova_consultations FOR ALL
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage transcripts" ON larinova_transcripts;
CREATE POLICY "Authenticated users can manage transcripts"
ON larinova_transcripts FOR ALL
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage prescriptions" ON larinova_prescriptions;
CREATE POLICY "Authenticated users can manage prescriptions"
ON larinova_prescriptions FOR ALL
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage prescription items" ON larinova_prescription_items;
CREATE POLICY "Authenticated users can manage prescription items"
ON larinova_prescription_items FOR ALL
TO authenticated
USING (true);

-- ============================================================
-- 4. SEED MOCK MEDICINE DATA (20 medicines)
-- ============================================================

INSERT INTO larinova_medicines (name, generic_name, category, manufacturer, common_dosages, common_frequencies, warnings) VALUES
  ('Amoxicillin', 'Amoxicillin', 'antibiotic', 'Generic Pharma', '["250mg", "500mg"]', '["Twice daily", "Three times daily"]', 'May cause allergic reactions'),
  ('Paracetamol', 'Acetaminophen', 'painkiller', 'Generic Pharma', '["500mg", "1000mg"]', '["As needed (max 4g/day)", "Every 6 hours"]', 'Do not exceed recommended dose'),
  ('Ibuprofen', 'Ibuprofen', 'painkiller', 'Generic Pharma', '["200mg", "400mg", "600mg"]', '["Twice daily", "Three times daily"]', 'Take with food'),
  ('Azithromycin', 'Azithromycin', 'antibiotic', 'Generic Pharma', '["250mg", "500mg"]', '["Once daily"]', 'Complete full course'),
  ('Cetirizine', 'Cetirizine', 'antihistamine', 'Generic Pharma', '["10mg"]', '["Once daily"]', 'May cause drowsiness'),
  ('Omeprazole', 'Omeprazole', 'antacid', 'Generic Pharma', '["20mg", "40mg"]', '["Once daily before meals"]', 'Take on empty stomach'),
  ('Metformin', 'Metformin', 'antidiabetic', 'Generic Pharma', '["500mg", "850mg", "1000mg"]', '["Twice daily", "Three times daily"]', 'Monitor blood sugar'),
  ('Amlodipine', 'Amlodipine', 'antihypertensive', 'Generic Pharma', '["5mg", "10mg"]', '["Once daily"]', 'Monitor blood pressure'),
  ('Vitamin D3', 'Cholecalciferol', 'vitamin', 'Generic Pharma', '["1000IU", "2000IU"]', '["Once daily"]', NULL),
  ('Calcium + Vitamin D', 'Calcium Carbonate', 'supplement', 'Generic Pharma', '["500mg + 200IU"]', '["Once daily"]', 'Take with meals'),
  ('Cough Syrup', 'Dextromethorphan', 'other', 'Generic Pharma', '["5ml", "10ml"]', '["Every 6 hours"]', 'Not for children under 4'),
  ('Aspirin', 'Acetylsalicylic Acid', 'painkiller', 'Generic Pharma', '["75mg", "300mg"]', '["Once daily"]', 'Blood thinner - consult doctor'),
  ('Ciprofloxacin', 'Ciprofloxacin', 'antibiotic', 'Generic Pharma', '["250mg", "500mg"]', '["Twice daily"]', 'Avoid dairy products'),
  ('Loratadine', 'Loratadine', 'antihistamine', 'Generic Pharma', '["10mg"]', '["Once daily"]', 'Non-drowsy'),
  ('Ranitidine', 'Ranitidine', 'antacid', 'Generic Pharma', '["150mg", "300mg"]', '["Twice daily"]', NULL),
  ('Insulin Glargine', 'Insulin Glargine', 'antidiabetic', 'Generic Pharma', '["10 units", "20 units"]', '["Once daily"]', 'Refrigerate until use'),
  ('Atenolol', 'Atenolol', 'antihypertensive', 'Generic Pharma', '["25mg", "50mg", "100mg"]', '["Once daily"]', 'Do not stop suddenly'),
  ('Multivitamin', 'Mixed Vitamins', 'vitamin', 'Generic Pharma', '["1 tablet"]', '["Once daily"]', NULL),
  ('Iron Supplement', 'Ferrous Sulfate', 'supplement', 'Generic Pharma', '["65mg"]', '["Once daily"]', 'May cause constipation'),
  ('Antibiotic Ointment', 'Neomycin', 'antibiotic', 'Generic Pharma', '["Apply thin layer"]', '["Twice daily"]', 'For external use only')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
