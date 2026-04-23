-- Add AI summary and diarized columns to consultations table

ALTER TABLE larinova_consultations
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS diarized BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN larinova_consultations.ai_summary IS 'AI-generated summary of the consultation from Claude';
COMMENT ON COLUMN larinova_consultations.diarized IS 'Whether the transcripts have been diarized (speaker identification)';
