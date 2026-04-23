# Larinova MVP - Database Schema

## Overview

This document contains the complete database schema for Larinova MVP. All tables are prefixed with `larinova_` to avoid conflicts in shared Supabase projects.

**Database**: PostgreSQL (via Supabase)
**Naming Convention**: `larinova_[table_name]`
**Character Set**: UTF-8

---

## Table Schema

### 1. larinova_doctors

Stores doctor profile information and authentication data.

```sql
CREATE TABLE larinova_doctors (
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

-- Index for faster lookups
CREATE INDEX idx_larinova_doctors_user_id ON larinova_doctors(user_id);
CREATE INDEX idx_larinova_doctors_email ON larinova_doctors(email);
```

---

### 2. larinova_patients

Stores patient information and contact details.

```sql
CREATE TABLE larinova_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT UNIQUE NOT NULL, -- e.g., "KP-2026-0001"
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

-- Indexes
CREATE INDEX idx_larinova_patients_email ON larinova_patients(email);
CREATE INDEX idx_larinova_patients_patient_code ON larinova_patients(patient_code);
CREATE INDEX idx_larinova_patients_created_by ON larinova_patients(created_by_doctor_id);

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

CREATE TRIGGER set_patient_code
BEFORE INSERT ON larinova_patients
FOR EACH ROW
WHEN (NEW.patient_code IS NULL)
EXECUTE FUNCTION generate_patient_code();
```

---

### 3. larinova_insurance

Stores patient insurance information.

```sql
CREATE TABLE larinova_insurance (
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

-- Index
CREATE INDEX idx_larinova_insurance_patient_id ON larinova_insurance(patient_id);
CREATE INDEX idx_larinova_insurance_active ON larinova_insurance(patient_id, is_active);
```

---

### 4. larinova_health_records

Stores patient health records and medical history.

```sql
CREATE TABLE larinova_health_records (
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
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional structured data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_larinova_health_records_patient_id ON larinova_health_records(patient_id);
CREATE INDEX idx_larinova_health_records_record_type ON larinova_health_records(record_type);
CREATE INDEX idx_larinova_health_records_date ON larinova_health_records(record_date DESC);
```

---

### 5. larinova_consultations

Stores consultation session information.

```sql
CREATE TABLE larinova_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  consultation_code TEXT UNIQUE NOT NULL, -- e.g., "KC-2026-0001"
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Auto-calculated
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',
    'completed',
    'cancelled'
  )),
  chief_complaint TEXT,
  diagnosis TEXT,
  summary TEXT, -- AI-generated summary
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_larinova_consultations_patient_id ON larinova_consultations(patient_id);
CREATE INDEX idx_larinova_consultations_doctor_id ON larinova_consultations(doctor_id);
CREATE INDEX idx_larinova_consultations_status ON larinova_consultations(status);
CREATE INDEX idx_larinova_consultations_start_time ON larinova_consultations(start_time DESC);

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

CREATE TRIGGER set_consultation_code
BEFORE INSERT ON larinova_consultations
FOR EACH ROW
WHEN (NEW.consultation_code IS NULL)
EXECUTE FUNCTION generate_consultation_code();

-- Auto-calculate duration
CREATE OR REPLACE FUNCTION calculate_consultation_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_consultation_duration
BEFORE INSERT OR UPDATE ON larinova_consultations
FOR EACH ROW
EXECUTE FUNCTION calculate_consultation_duration();
```

---

### 6. larinova_transcripts

Stores real-time transcription data from consultations.

```sql
CREATE TABLE larinova_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('doctor', 'patient', 'unknown')),
  text TEXT NOT NULL,
  language TEXT, -- Detected language code (e.g., 'en', 'ar')
  confidence FLOAT, -- Transcription confidence (0-1)
  timestamp_start FLOAT, -- Seconds from start of recording
  timestamp_end FLOAT,
  assemblyai_id TEXT, -- AssemblyAI transcript ID for reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_larinova_transcripts_consultation_id ON larinova_transcripts(consultation_id);
CREATE INDEX idx_larinova_transcripts_speaker ON larinova_transcripts(speaker);
CREATE INDEX idx_larinova_transcripts_timestamp ON larinova_transcripts(timestamp_start);
```

---

### 7. larinova_medicines

Mock medicine database for prescription creation.

```sql
CREATE TABLE larinova_medicines (
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
  common_dosages JSONB DEFAULT '[]'::jsonb, -- e.g., ["500mg", "1000mg"]
  common_frequencies JSONB DEFAULT '[]'::jsonb, -- e.g., ["Once daily", "Twice daily"]
  warnings TEXT,
  is_prescription_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_larinova_medicines_name ON larinova_medicines(name);
CREATE INDEX idx_larinova_medicines_category ON larinova_medicines(category);
CREATE INDEX idx_larinova_medicines_active ON larinova_medicines(is_active);

-- Full-text search
CREATE INDEX idx_larinova_medicines_search ON larinova_medicines
USING GIN (to_tsvector('english', name || ' ' || COALESCE(generic_name, '')));
```

---

### 8. larinova_prescriptions

Stores prescription information.

```sql
CREATE TABLE larinova_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  prescription_code TEXT UNIQUE NOT NULL, -- e.g., "KRX-2026-0001"
  doctor_notes TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_larinova_prescriptions_consultation_id ON larinova_prescriptions(consultation_id);
CREATE INDEX idx_larinova_prescriptions_patient_id ON larinova_prescriptions(patient_id);
CREATE INDEX idx_larinova_prescriptions_doctor_id ON larinova_prescriptions(doctor_id);

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

CREATE TRIGGER set_prescription_code
BEFORE INSERT ON larinova_prescriptions
FOR EACH ROW
WHEN (NEW.prescription_code IS NULL)
EXECUTE FUNCTION generate_prescription_code();
```

---

### 9. larinova_prescription_items

Individual medicine items in a prescription.

```sql
CREATE TABLE larinova_prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES larinova_prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES larinova_medicines(id) ON DELETE RESTRICT,
  medicine_name TEXT NOT NULL, -- Denormalized for history
  dosage TEXT NOT NULL, -- e.g., "500mg"
  frequency TEXT NOT NULL, -- e.g., "Twice daily"
  duration TEXT NOT NULL, -- e.g., "7 days"
  instructions TEXT, -- e.g., "Take after meals"
  quantity INTEGER, -- Total quantity prescribed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_larinova_prescription_items_prescription_id ON larinova_prescription_items(prescription_id);
```

---

## Row Level Security (RLS) Policies

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE larinova_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_prescription_items ENABLE ROW LEVEL SECURITY;

-- Doctors can read their own profile
CREATE POLICY "Doctors can view own profile"
ON larinova_doctors FOR SELECT
USING (auth.uid() = user_id);

-- Doctors can update their own profile
CREATE POLICY "Doctors can update own profile"
ON larinova_doctors FOR UPDATE
USING (auth.uid() = user_id);

-- Doctors can view all patients
CREATE POLICY "Doctors can view all patients"
ON larinova_patients FOR SELECT
TO authenticated
USING (true);

-- Doctors can insert patients
CREATE POLICY "Doctors can insert patients"
ON larinova_patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Doctors can update patients
CREATE POLICY "Doctors can update patients"
ON larinova_patients FOR UPDATE
TO authenticated
USING (true);

-- Similar policies for other tables (adjust based on your needs)

-- All authenticated users can read medicines
CREATE POLICY "Authenticated users can view medicines"
ON larinova_medicines FOR SELECT
TO authenticated
USING (is_active = true);
```

---

## Mock Data Seed

### Seed Medicines Data

```sql
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
  ('Antibiotic Ointment', 'Neomycin', 'antibiotic', 'Generic Pharma', '["Apply thin layer"]', '["Twice daily"]', 'For external use only');
```

---

## Complete Migration Script

Copy this entire script and run it in Supabase SQL Editor:

```sql
-- Larinova MVP Database Migration
-- Run this entire script in Supabase SQL Editor

-- 1. Create tables in order (respecting foreign keys)

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

CREATE INDEX IF NOT EXISTS idx_larinova_doctors_user_id ON larinova_doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_larinova_doctors_email ON larinova_doctors(email);

-- Patients table
CREATE TABLE IF NOT EXISTS larinova_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_larinova_patients_email ON larinova_patients(email);
CREATE INDEX IF NOT EXISTS idx_larinova_patients_patient_code ON larinova_patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_larinova_patients_created_by ON larinova_patients(created_by_doctor_id);

-- Remaining tables... (truncated for brevity - use full schema above)

-- 2. Create functions and triggers (shown in detail above)

-- 3. Enable RLS (shown in detail above)

-- 4. Seed mock data (shown above)

-- Migration Complete!
```

---

## Database Management Commands

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Pull remote schema
supabase db pull

# Push local migrations
supabase db push
```

### Manual Management via Dashboard

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste migration SQL
3. Click **Run**
4. Check **Table Editor** to verify tables created

---

## Next Steps

1. ✅ Copy migration SQL to Supabase SQL Editor
2. ✅ Run migration to create all tables
3. ✅ Verify tables in Table Editor
4. ✅ Test RLS policies
5. ✅ Seed medicine data
6. 🚀 Start building application

---

**Document Version:** 1.0
**Last Updated:** January 23, 2026
