-- Drop the old language check constraint that conflicts with the new locale constraint
ALTER TABLE larinova_doctors DROP CONSTRAINT IF EXISTS kosyn_doctors_language_check;

-- Rename all kosyn_* constraints to larinova_*
-- larinova_doctors
DO $$ BEGIN ALTER TABLE larinova_doctors RENAME CONSTRAINT kosyn_doctors_pkey TO larinova_doctors_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_doctors RENAME CONSTRAINT kosyn_doctors_email_key TO larinova_doctors_email_key; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_doctors RENAME CONSTRAINT kosyn_doctors_user_id_fkey TO larinova_doctors_user_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_patients
DO $$ BEGIN ALTER TABLE larinova_patients RENAME CONSTRAINT kosyn_patients_gender_check TO larinova_patients_gender_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_patients RENAME CONSTRAINT kosyn_patients_pkey TO larinova_patients_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_patients RENAME CONSTRAINT kosyn_patients_patient_code_key TO larinova_patients_patient_code_key; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_patients RENAME CONSTRAINT kosyn_patients_created_by_doctor_id_fkey TO larinova_patients_created_by_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_consultations
DO $$ BEGIN ALTER TABLE larinova_consultations RENAME CONSTRAINT kosyn_consultations_status_check TO larinova_consultations_status_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_consultations RENAME CONSTRAINT kosyn_consultations_pkey TO larinova_consultations_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_consultations RENAME CONSTRAINT kosyn_consultations_consultation_code_key TO larinova_consultations_consultation_code_key; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_consultations RENAME CONSTRAINT kosyn_consultations_patient_id_fkey TO larinova_consultations_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_consultations RENAME CONSTRAINT kosyn_consultations_doctor_id_fkey TO larinova_consultations_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_transcripts
DO $$ BEGIN ALTER TABLE larinova_transcripts RENAME CONSTRAINT kosyn_transcripts_speaker_check TO larinova_transcripts_speaker_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_transcripts RENAME CONSTRAINT kosyn_transcripts_pkey TO larinova_transcripts_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_transcripts RENAME CONSTRAINT kosyn_transcripts_consultation_id_fkey TO larinova_transcripts_consultation_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_medicines
DO $$ BEGIN ALTER TABLE larinova_medicines RENAME CONSTRAINT kosyn_medicines_category_check TO larinova_medicines_category_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_medicines RENAME CONSTRAINT kosyn_medicines_pkey TO larinova_medicines_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_prescriptions
DO $$ BEGIN ALTER TABLE larinova_prescriptions RENAME CONSTRAINT kosyn_prescriptions_status_check TO larinova_prescriptions_status_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescriptions RENAME CONSTRAINT kosyn_prescriptions_pkey TO larinova_prescriptions_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescriptions RENAME CONSTRAINT kosyn_prescriptions_prescription_code_key TO larinova_prescriptions_prescription_code_key; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescriptions RENAME CONSTRAINT kosyn_prescriptions_consultation_id_fkey TO larinova_prescriptions_consultation_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescriptions RENAME CONSTRAINT kosyn_prescriptions_patient_id_fkey TO larinova_prescriptions_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescriptions RENAME CONSTRAINT kosyn_prescriptions_doctor_id_fkey TO larinova_prescriptions_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_prescription_items
DO $$ BEGIN ALTER TABLE larinova_prescription_items RENAME CONSTRAINT kosyn_prescription_items_pkey TO larinova_prescription_items_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescription_items RENAME CONSTRAINT kosyn_prescription_items_prescription_id_fkey TO larinova_prescription_items_prescription_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_prescription_items RENAME CONSTRAINT kosyn_prescription_items_medicine_id_fkey TO larinova_prescription_items_medicine_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_health_records
DO $$ BEGIN ALTER TABLE larinova_health_records RENAME CONSTRAINT kosyn_health_records_record_type_check TO larinova_health_records_record_type_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_health_records RENAME CONSTRAINT kosyn_health_records_severity_check TO larinova_health_records_severity_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_health_records RENAME CONSTRAINT kosyn_health_records_pkey TO larinova_health_records_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_health_records RENAME CONSTRAINT kosyn_health_records_patient_id_fkey TO larinova_health_records_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_health_records RENAME CONSTRAINT kosyn_health_records_doctor_id_fkey TO larinova_health_records_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_insurance
DO $$ BEGIN ALTER TABLE larinova_insurance RENAME CONSTRAINT kosyn_insurance_pkey TO larinova_insurance_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_insurance RENAME CONSTRAINT kosyn_insurance_patient_id_fkey TO larinova_insurance_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_tasks
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_type_check TO larinova_tasks_type_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_status_check TO larinova_tasks_status_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_priority_check TO larinova_tasks_priority_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_pkey TO larinova_tasks_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_patient_id_fkey TO larinova_tasks_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_consultation_id_fkey TO larinova_tasks_consultation_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_created_by_fkey TO larinova_tasks_created_by_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_tasks RENAME CONSTRAINT kosyn_tasks_assigned_to_fkey TO larinova_tasks_assigned_to_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_documents
DO $$ BEGIN ALTER TABLE larinova_documents RENAME CONSTRAINT kosyn_documents_pkey TO larinova_documents_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_documents RENAME CONSTRAINT kosyn_documents_doctor_id_fkey TO larinova_documents_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_documents RENAME CONSTRAINT kosyn_documents_patient_id_fkey TO larinova_documents_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_documents RENAME CONSTRAINT kosyn_documents_consultation_id_fkey TO larinova_documents_consultation_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_documents RENAME CONSTRAINT kosyn_documents_conversation_id_fkey TO larinova_documents_conversation_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_document_views
DO $$ BEGIN ALTER TABLE larinova_document_views RENAME CONSTRAINT kosyn_document_views_document_type_check TO larinova_document_views_document_type_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_document_views RENAME CONSTRAINT kosyn_document_views_pkey TO larinova_document_views_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_document_views RENAME CONSTRAINT kosyn_document_views_doctor_id_fkey TO larinova_document_views_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_document_views RENAME CONSTRAINT kosyn_document_views_patient_id_fkey TO larinova_document_views_patient_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_subscriptions
DO $$ BEGIN ALTER TABLE larinova_subscriptions RENAME CONSTRAINT kosyn_subscriptions_plan_check TO larinova_subscriptions_plan_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_subscriptions RENAME CONSTRAINT kosyn_subscriptions_billing_interval_check TO larinova_subscriptions_billing_interval_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_subscriptions RENAME CONSTRAINT kosyn_subscriptions_status_check TO larinova_subscriptions_status_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_subscriptions RENAME CONSTRAINT kosyn_subscriptions_pkey TO larinova_subscriptions_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_subscriptions RENAME CONSTRAINT kosyn_subscriptions_doctor_id_key TO larinova_subscriptions_doctor_id_key; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_subscriptions RENAME CONSTRAINT kosyn_subscriptions_doctor_id_fkey TO larinova_subscriptions_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- larinova_ai_usage
DO $$ BEGIN ALTER TABLE larinova_ai_usage RENAME CONSTRAINT kosyn_ai_usage_feature_check TO larinova_ai_usage_feature_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_ai_usage RENAME CONSTRAINT kosyn_ai_usage_pkey TO larinova_ai_usage_pkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_ai_usage RENAME CONSTRAINT kosyn_ai_usage_doctor_id_fkey TO larinova_ai_usage_doctor_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE larinova_ai_usage RENAME CONSTRAINT kosyn_ai_usage_consultation_id_fkey TO larinova_ai_usage_consultation_id_fkey; EXCEPTION WHEN undefined_object THEN NULL; END $$;
