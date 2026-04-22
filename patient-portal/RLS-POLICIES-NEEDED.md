# RLS policies required for patient-portal

The patient portal at `patient.larinova.com` uses the shared Supabase DB. A
patient is authenticated via magic-link → their JWT carries `email`. These
policies must be added in a migration **owned by Team NotifyAgents** (the
patient-portal team must not touch `app/supabase/migrations/`).

Flag these to the lead on completion — coordinate a single migration rather
than four piecemeal ones.

## 1. `larinova_patients` — SELECT own row by email

```sql
ALTER TABLE larinova_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_self_select"
  ON larinova_patients FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));
```

## 2. `larinova_appointments` — SELECT by booker_email

Until Team NotifyAgents adds a `patient_id` FK on `larinova_appointments`, the
link from authed user → appointment is via `booker_email`. After the FK lands,
swap the policy to an `EXISTS` subquery against `larinova_patients`.

```sql
CREATE POLICY "patient_view_own_appointments"
  ON larinova_appointments FOR SELECT
  USING (booker_email = (auth.jwt() ->> 'email'));

-- Cancellation flows through the main app API (CORS + service-role), so no
-- UPDATE policy for patients is required here.
```

## 3. `larinova_prescriptions` — SELECT via patient_id

```sql
CREATE POLICY "patient_view_own_rx"
  ON larinova_prescriptions FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

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
```

## 4. `larinova_patient_documents` (table owned by Team NotifyAgents)

Must include `patient_id UUID REFERENCES larinova_patients(id)`.

```sql
CREATE POLICY "patient_view_own_documents"
  ON larinova_patient_documents FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "patient_insert_own_documents"
  ON larinova_patient_documents FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );
```

## 5. `larinova_doctors` — SELECT public fields only

The appointment detail page reads `full_name`, `clinic_name`, `clinic_address`,
`video_call_link` for the patient's own doctor. Options:

**Option A (simplest):** widen the existing "public read doctors" policy (if
any) to include these columns — already public-ish.

**Option B (tighter):** scoped policy that only reveals a doctor when a
signed-in patient has a matching appointment:

```sql
CREATE POLICY "patient_view_own_doctor"
  ON larinova_doctors FOR SELECT
  USING (
    id IN (
      SELECT doctor_id FROM larinova_appointments
      WHERE booker_email = (auth.jwt() ->> 'email')
    )
  );
```

## 6. Supabase Storage — bucket `patient-documents`

Bucket creation is owned by Team NotifyAgents. Required policies:

```sql
-- Allow authed patients to upload under their email-prefixed path.
CREATE POLICY "patient_upload_own_documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "patient_read_own_documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-documents');
```

Tighter scoping (path prefix by appointment_id) can come later — for v1,
any authenticated user with a session is a patient, since the portal is the
only auth surface for them.

## 7. `larinova_agent_jobs` (if used for "AI-requested documents")

```sql
CREATE POLICY "patient_view_own_jobs"
  ON larinova_agent_jobs FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM larinova_patients
      WHERE email = (auth.jwt() ->> 'email')
    )
  );
```

---

**Summary for the migration author (Team NotifyAgents):**

- Enable RLS on each table above if not already.
- Add the `SELECT` policies so the patient can only see their own rows.
- Add the one `INSERT` policy on `larinova_patient_documents` so uploads go
  through directly from the browser.
- Add storage.objects policies for the `patient-documents` bucket.
- Cancel + reschedule flows go through `app.larinova.com` API routes, which
  use the service role — no patient-facing UPDATE/DELETE policies required.
