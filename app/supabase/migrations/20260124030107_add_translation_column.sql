-- Add translation column to larinova_transcripts table
ALTER TABLE larinova_transcripts 
ADD COLUMN IF NOT EXISTS translation TEXT;
