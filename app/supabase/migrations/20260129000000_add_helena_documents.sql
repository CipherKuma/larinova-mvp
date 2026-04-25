-- Migration: Add Helena documents and conversation tables
-- This migration creates tables for storing generated medical documents
-- and Helena AI conversation history

-- Create document types enum
CREATE TYPE document_type AS ENUM (
  'referral_letter',
  'medical_certificate',
  'insurance_report',
  'fitness_to_work',
  'disability_report',
  'transfer_summary',
  'prescription_letter',
  'general'
);

-- Create larinova_documents table for storing generated documents
CREATE TABLE IF NOT EXISTS larinova_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE SET NULL,
  conversation_id UUID, -- FK added in 20260129000001_fix_documents_fk.sql (helena_conversations)

  -- Document metadata
  document_type document_type NOT NULL DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Document content
  content TEXT NOT NULL,
  content_html TEXT, -- Optional HTML formatted version

  -- Additional metadata as JSON (recipient info, diagnosis codes, etc.)
  metadata JSONB DEFAULT '{}',

  -- File storage (if PDF is generated)
  file_url TEXT,
  file_name VARCHAR(255),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, sent
  sent_at TIMESTAMPTZ,
  sent_to VARCHAR(255), -- email or recipient

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create helena_conversations table (extends agent_conversations for Helena-specific data)
CREATE TABLE IF NOT EXISTS helena_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES larinova_patients(id) ON DELETE SET NULL,

  -- Conversation metadata
  title VARCHAR(255),

  -- Current context for the conversation
  context JSONB DEFAULT '{}', -- stores patient info, recent consultations, etc.

  -- Active document being generated (if any)
  active_document_type document_type,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, completed

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create helena_messages table for storing chat history
CREATE TABLE IF NOT EXISTS helena_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES helena_conversations(id) ON DELETE CASCADE NOT NULL,

  -- Message content
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,

  -- Document reference (if this message contains/references a document)
  document_id UUID REFERENCES larinova_documents(id) ON DELETE SET NULL,

  -- Message metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_documents_doctor_id ON larinova_documents(doctor_id);
CREATE INDEX idx_documents_patient_id ON larinova_documents(patient_id);
CREATE INDEX idx_documents_type ON larinova_documents(document_type);
CREATE INDEX idx_documents_created_at ON larinova_documents(created_at DESC);

CREATE INDEX idx_helena_conversations_doctor_id ON helena_conversations(doctor_id);
CREATE INDEX idx_helena_conversations_patient_id ON helena_conversations(patient_id);
CREATE INDEX idx_helena_conversations_status ON helena_conversations(status);

CREATE INDEX idx_helena_messages_conversation_id ON helena_messages(conversation_id);
CREATE INDEX idx_helena_messages_created_at ON helena_messages(created_at);

-- Enable RLS
ALTER TABLE larinova_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE helena_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE helena_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for larinova_documents
CREATE POLICY "Doctors can view their own documents"
  ON larinova_documents FOR SELECT
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Doctors can insert their own documents"
  ON larinova_documents FOR INSERT
  WITH CHECK (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Doctors can update their own documents"
  ON larinova_documents FOR UPDATE
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Doctors can delete their own documents"
  ON larinova_documents FOR DELETE
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

-- RLS Policies for helena_conversations
CREATE POLICY "Doctors can view their own conversations"
  ON helena_conversations FOR SELECT
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Doctors can insert their own conversations"
  ON helena_conversations FOR INSERT
  WITH CHECK (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Doctors can update their own conversations"
  ON helena_conversations FOR UPDATE
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

-- RLS Policies for helena_messages
CREATE POLICY "Doctors can view messages in their conversations"
  ON helena_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM helena_conversations WHERE doctor_id IN (
      SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Doctors can insert messages in their conversations"
  ON helena_messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM helena_conversations WHERE doctor_id IN (
      SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
    )
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_helena_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_larinova_documents_updated_at
  BEFORE UPDATE ON larinova_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_helena_updated_at();

CREATE TRIGGER update_helena_conversations_updated_at
  BEFORE UPDATE ON helena_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_helena_updated_at();
