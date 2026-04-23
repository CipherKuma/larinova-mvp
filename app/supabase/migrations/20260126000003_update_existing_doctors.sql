-- Update existing doctor records to have default values for new fields
UPDATE larinova_doctors
SET
  language = COALESCE(language, 'en'),
  onboarding_completed = COALESCE(onboarding_completed, TRUE)
WHERE language IS NULL OR onboarding_completed IS NULL;
