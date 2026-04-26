-- In-app issue tracker with threaded chat. Doctors see only their
-- own issues (RLS-enforced); admin reads/writes via service role.
-- Spec: docs/superpowers/specs/2026-04-26-admin-analytics-issues-design.md §5.4

CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'wont_fix');
CREATE TYPE issue_priority AS ENUM ('low', 'normal', 'high');
CREATE TYPE issue_message_role AS ENUM ('doctor', 'admin');

CREATE TABLE larinova_issues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 140),
  body         TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  status       issue_status NOT NULL DEFAULT 'open',
  priority     issue_priority NOT NULL DEFAULT 'normal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX idx_issues_doctor ON larinova_issues (doctor_id, created_at DESC);
CREATE INDEX idx_issues_status ON larinova_issues (status, created_at DESC);

CREATE TABLE larinova_issue_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID NOT NULL REFERENCES larinova_issues(id) ON DELETE CASCADE,
  sender_role     issue_message_role NOT NULL,
  sender_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body            TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_issue_messages_issue ON larinova_issue_messages (issue_id, created_at);

ALTER TABLE larinova_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_issue_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY issues_select_own ON larinova_issues FOR SELECT TO authenticated
  USING (doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY issues_insert_own ON larinova_issues FOR INSERT TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid()));

CREATE POLICY issue_messages_select_own ON larinova_issue_messages FOR SELECT TO authenticated
  USING (issue_id IN (
    SELECT i.id FROM larinova_issues i
    JOIN larinova_doctors d ON d.id = i.doctor_id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY issue_messages_insert_own ON larinova_issue_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'doctor'
    AND sender_user_id = auth.uid()
    AND issue_id IN (
      SELECT i.id FROM larinova_issues i
      JOIN larinova_doctors d ON d.id = i.doctor_id
      WHERE d.user_id = auth.uid()
    )
  );

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION larinova_issues_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_larinova_issues_touch
  BEFORE UPDATE ON larinova_issues
  FOR EACH ROW EXECUTE FUNCTION larinova_issues_touch_updated_at();
