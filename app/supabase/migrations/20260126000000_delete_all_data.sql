-- ============================================================
-- DELETE ALL DATA FROM Larinova DATABASE
-- ============================================================
-- WARNING: This will permanently delete ALL data from ALL tables
-- This operation cannot be undone
-- ============================================================

-- Disable triggers temporarily to avoid issues with auto-generation functions
SET session_replication_role = replica;

-- Delete data in correct order (child tables first, then parent tables)

-- 1. Delete from tables with no child dependencies first
TRUNCATE TABLE larinova_document_views CASCADE;
TRUNCATE TABLE larinova_tasks CASCADE;
TRUNCATE TABLE larinova_prescription_items CASCADE;

-- 2. Delete from intermediate tables
TRUNCATE TABLE larinova_transcripts CASCADE;
TRUNCATE TABLE larinova_prescriptions CASCADE;

-- 3. Delete from consultation-related tables
TRUNCATE TABLE larinova_consultations CASCADE;

-- 4. Delete from patient-related tables
TRUNCATE TABLE larinova_health_records CASCADE;
TRUNCATE TABLE larinova_insurance CASCADE;

-- 5. Delete from main entity tables
TRUNCATE TABLE larinova_patients CASCADE;
TRUNCATE TABLE larinova_doctors CASCADE;

-- 6. Keep medicines table (reference data) but can be cleared if needed
-- Uncomment the line below if you want to delete medicines as well
-- TRUNCATE TABLE larinova_medicines CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ============================================================
-- MIGRATION COMPLETE
-- All data has been deleted from the database
-- ============================================================
