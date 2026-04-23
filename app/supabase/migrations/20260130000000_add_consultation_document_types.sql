-- Add consultation-related document types to the document_type enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'transcript';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'consultation_summary';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'soap_note';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'medical_codes';
