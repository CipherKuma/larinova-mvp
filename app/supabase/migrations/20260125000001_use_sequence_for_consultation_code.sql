-- Use PostgreSQL sequence for consultation code generation
-- This is a more robust approach that prevents race conditions

-- Create a sequence for consultation codes
CREATE SEQUENCE IF NOT EXISTS larinova_consultation_code_seq;

-- Replace the consultation code generation function
CREATE OR REPLACE FUNCTION generate_consultation_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  -- If consultation_code is already provided, use it
  IF NEW.consultation_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next value from sequence
  sequence_num := nextval('larinova_consultation_code_seq');

  -- Generate the consultation code
  new_code := 'KC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.consultation_code := new_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists from the previous migration, no need to recreate it

-- Initialize the sequence to the correct value based on existing data
DO $$
DECLARE
  max_seq INTEGER;
BEGIN
  -- Find the maximum sequence number from existing consultation codes
  SELECT COALESCE(MAX(CAST(SUBSTRING(consultation_code FROM '\d+$') AS INTEGER)), 0)
  INTO max_seq
  FROM larinova_consultations;

  -- Set the sequence to start from the next number (minimum 1)
  IF max_seq > 0 THEN
    PERFORM setval('larinova_consultation_code_seq', max_seq);
  ELSE
    -- If no consultations exist, start from 1
    PERFORM setval('larinova_consultation_code_seq', 1);
  END IF;
END $$;
