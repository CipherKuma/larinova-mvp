-- Add Indian prescription fields to prescriptions and prescription items

ALTER TABLE larinova_prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE larinova_prescriptions ADD COLUMN IF NOT EXISTS allergy_warnings TEXT;

ALTER TABLE larinova_prescription_items ADD COLUMN IF NOT EXISTS route TEXT;
ALTER TABLE larinova_prescription_items ADD COLUMN IF NOT EXISTS food_timing TEXT;
