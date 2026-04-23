-- Clean up all consultation-related data
-- This migration removes all consultations, prescriptions, prescription items, and transcripts

-- Delete prescription items first (no cascade dependencies)
DELETE FROM larinova_prescription_items;

-- Delete prescriptions (has FK to consultations)
DELETE FROM larinova_prescriptions;

-- Delete transcripts (has FK to consultations)
DELETE FROM larinova_transcripts;

-- Delete all consultations
DELETE FROM larinova_consultations;

-- Verify cleanup
DO $$
BEGIN
  RAISE NOTICE 'Cleanup complete:';
  RAISE NOTICE '- Prescription items deleted: %', (SELECT COUNT(*) FROM larinova_prescription_items);
  RAISE NOTICE '- Prescriptions deleted: %', (SELECT COUNT(*) FROM larinova_prescriptions);
  RAISE NOTICE '- Transcripts deleted: %', (SELECT COUNT(*) FROM larinova_transcripts);
  RAISE NOTICE '- Consultations deleted: %', (SELECT COUNT(*) FROM larinova_consultations);
END $$;
