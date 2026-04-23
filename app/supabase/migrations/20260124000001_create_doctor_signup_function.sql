-- Create a function to insert doctor profile with elevated privileges
CREATE OR REPLACE FUNCTION public.create_doctor_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_specialization TEXT,
  p_license_number TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- Insert the doctor profile
  INSERT INTO larinova_doctors (
    user_id,
    email,
    full_name,
    specialization,
    license_number
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_specialization,
    p_license_number
  )
  RETURNING id INTO v_doctor_id;

  RETURN v_doctor_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_doctor_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_doctor_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;
