-- Update the create_doctor_profile function to include language and onboarding_completed
CREATE OR REPLACE FUNCTION public.create_doctor_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_specialization TEXT DEFAULT 'Not Specified',
  p_license_number TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_onboarding_completed BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- Insert the doctor profile with new fields
  INSERT INTO larinova_doctors (
    user_id,
    email,
    full_name,
    specialization,
    license_number,
    language,
    onboarding_completed
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_specialization,
    p_license_number,
    p_language,
    p_onboarding_completed
  )
  RETURNING id INTO v_doctor_id;

  RETURN v_doctor_id;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_doctor_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_doctor_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;
