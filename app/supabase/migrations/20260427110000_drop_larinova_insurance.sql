-- Drop larinova_insurance: orphaned table (read-only by InsuranceView, no
-- write path anywhere in the codebase). Insurance is not in the v1 spec.
-- The InsuranceView component, the patients-detail tab, and the i18n
-- strings have been removed in the same change.
DROP TABLE IF EXISTS larinova_insurance CASCADE;
