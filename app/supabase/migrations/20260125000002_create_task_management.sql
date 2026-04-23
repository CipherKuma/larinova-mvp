-- Create task management system

-- Create tasks table
CREATE TABLE IF NOT EXISTS larinova_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('follow_up', 'prescription_review', 'record_completion', 'general')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES larinova_doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create document views tracking table
CREATE TABLE IF NOT EXISTS larinova_document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('consultation', 'prescription', 'health_record', 'lab_report')),
  document_id UUID NOT NULL,
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_assigned_to ON larinova_tasks(assigned_to, status, due_date);
CREATE INDEX idx_tasks_patient ON larinova_tasks(patient_id);
CREATE INDEX idx_tasks_status ON larinova_tasks(status, priority);
CREATE INDEX idx_tasks_created_at ON larinova_tasks(created_at DESC);

CREATE INDEX idx_document_views_doctor ON larinova_document_views(doctor_id, viewed_at DESC);
CREATE INDEX idx_document_views_type ON larinova_document_views(document_type, viewed_at DESC);
CREATE INDEX idx_document_views_patient ON larinova_document_views(patient_id);

-- Create updated_at trigger for tasks
CREATE OR REPLACE FUNCTION update_larinova_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_larinova_tasks_updated_at
  BEFORE UPDATE ON larinova_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_larinova_tasks_updated_at();

-- Enable RLS
ALTER TABLE larinova_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_document_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Doctors can view their assigned tasks"
  ON larinova_tasks FOR SELECT
  USING (assigned_to IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create tasks"
  ON larinova_tasks FOR INSERT
  WITH CHECK (created_by IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their tasks"
  ON larinova_tasks FOR UPDATE
  USING (
    assigned_to IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()) OR
    created_by IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors can delete their created tasks"
  ON larinova_tasks FOR DELETE
  USING (created_by IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

-- RLS Policies for document views
CREATE POLICY "Doctors can view their own document views"
  ON larinova_document_views FOR SELECT
  USING (doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create document views"
  ON larinova_document_views FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));
