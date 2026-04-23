-- Fix consultation code generation to prevent duplicates
-- This migration improves the consultation code generation to handle race conditions

-- Drop existing trigger
DROP TRIGGER IF EXISTS set_consultation_code ON larinova_consultations;

-- Replace the consultation code generation function with a more robust version
CREATE OR REPLACE FUNCTION generate_consultation_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- If consultation_code is already provided, use it
  IF NEW.consultation_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  LOOP
    -- Get the next sequence number with proper locking
    SELECT COALESCE(MAX(CAST(SUBSTRING(consultation_code FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM larinova_consultations
    WHERE consultation_code LIKE 'KC-' || year_part || '-%'
    FOR UPDATE;  -- Lock the rows to prevent race conditions

    new_code := 'KC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');

    -- Check if this code already exists
    IF NOT EXISTS (SELECT 1 FROM larinova_consultations WHERE consultation_code = new_code) THEN
      NEW.consultation_code := new_code;
      RETURN NEW;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique consultation code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER set_consultation_code
BEFORE INSERT ON larinova_consultations
FOR EACH ROW
EXECUTE FUNCTION generate_consultation_code();
