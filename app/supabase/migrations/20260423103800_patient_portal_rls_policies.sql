-- ============================================================
-- Patient Portal RLS policies (2026-04-23)
-- ============================================================
-- Bundled migration that provisions the 7 RLS policies flagged by
-- Team PatientPortal in patient-portal/RLS-POLICIES-NEEDED.md.
-- A patient authenticates via magic link; their JWT carries `email`.
-- Policies scope reads/writes so a patient can only see their own rows.
--
-- NB: UPDATE/DELETE for appointments intentionally goes through the
-- main app via CORS-scoped routes (service-role), so no patient-facing
-- mutation policy is granted on larinova_appointments.

-- --------------------------------------------------------------
-- 1. larinova_patients — SELECT own row by email
-- --------------------------------------------------------------
ALTER TABLE larinova_patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_self_select" ON larinova_patients;
CREATE POLICY "patient_self_select"
  ON larinova_patients FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

-- --------------------------------------------------------------
-- 2. larinova_appointments — SELECT via booker_email (until
--    patient_id backfill completes, which happens in the
--    main-app booking route) OR via patient_id FK.
-- --------------------------------------------------------------
DROP POLICY IF EXISTS "patient_view_own_appointments" ON larinova_appointments;
CREATE POLICY "patient_view_own_appointments"
  ON larinova_appointments FOR SELECT
  USING (
    booker_email = (auth.jwt() ->> 'email')
    OR patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- --------------------------------------------------------------
-- 3. larinova_prescriptions + items — SELECT via patient email.
-- --------------------------------------------------------------
ALTER TABLE larinova_prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_view_own_rx" ON larinova_prescriptions;
CREATE POLICY "patient_view_own_rx"
  ON larinova_prescriptions FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

ALTER TABLE larinova_prescription_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_view_own_rx_items" ON larinova_prescription_items;
CREATE POLICY "patient_view_own_rx_items"
  ON larinova_prescription_items FOR SELECT
  USING (
    prescription_id IN (
      SELECT id FROM larinova_prescriptions
      WHERE patient_id IN (
        SELECT id FROM larinova_patients
        WHERE email = (auth.jwt() ->> 'email')
      )
    )
  );

-- --------------------------------------------------------------
-- 4. larinova_patient_documents — SELECT + INSERT own rows.
-- --------------------------------------------------------------
DROP POLICY IF EXISTS "patient_view_own_documents" ON larinova_patient_documents;
CREATE POLICY "patient_view_own_documents"
  ON larinova_patient_documents FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "patient_insert_own_documents" ON larinova_patient_documents;
CREATE POLICY "patient_insert_own_documents"
  ON larinova_patient_documents FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- --------------------------------------------------------------
-- 5. larinova_doctors — patient sees only doctors they've booked.
-- --------------------------------------------------------------
DROP POLICY IF EXISTS "patient_view_own_doctor" ON larinova_doctors;
CREATE POLICY "patient_view_own_doctor"
  ON larinova_doctors FOR SELECT
  USING (
    id IN (
      SELECT doctor_id FROM larinova_appointments
      WHERE booker_email = (auth.jwt() ->> 'email')
         OR patient_id IN (
           SELECT id FROM larinova_patients
           WHERE email = (auth.jwt() ->> 'email')
         )
    )
  );

-- --------------------------------------------------------------
-- 6. Supabase Storage — patient-documents bucket policies.
-- --------------------------------------------------------------
DROP POLICY IF EXISTS "patient_upload_own_documents" ON storage.objects;
CREATE POLICY "patient_upload_own_documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-documents');

DROP POLICY IF EXISTS "patient_read_own_documents" ON storage.objects;
CREATE POLICY "patient_read_own_documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-documents');

-- --------------------------------------------------------------
-- 7. larinova_agent_jobs — patient can see jobs that reference
--    them (e.g. AI-requested intake info). Need a patient_id
--    column; nullable since most agent runs aren't patient-scoped.
-- --------------------------------------------------------------
ALTER TABLE larinova_agent_jobs
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES larinova_patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_larinova_agent_jobs_patient_id
  ON larinova_agent_jobs (patient_id) WHERE patient_id IS NOT NULL;

DROP POLICY IF EXISTS "patient_view_own_jobs" ON larinova_agent_jobs;
CREATE POLICY "patient_view_own_jobs"
  ON larinova_agent_jobs FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );
