-- Fix all DB functions that still reference old kosyn_* table names

-- 1. create_default_subscription trigger
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO larinova_subscriptions (doctor_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$function$;

-- 2. generate_patient_code trigger
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_code FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM larinova_patients
  WHERE patient_code LIKE 'KP-' || year_part || '-%';

  new_code := 'KP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.patient_code := new_code;

  RETURN NEW;
END;
$function$;

-- 3. generate_consultation_code trigger
CREATE OR REPLACE FUNCTION public.generate_consultation_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(consultation_code FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM larinova_consultations
  WHERE consultation_code LIKE 'KC-' || year_part || '-%';

  new_code := 'KC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.consultation_code := new_code;

  RETURN NEW;
END;
$function$;

-- 4. generate_prescription_code trigger
CREATE OR REPLACE FUNCTION public.generate_prescription_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(prescription_code FROM 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM larinova_prescriptions
  WHERE prescription_code LIKE 'KRX-' || year_part || '-%';

  new_code := 'KRX-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.prescription_code := new_code;

  RETURN NEW;
END;
$function$;
