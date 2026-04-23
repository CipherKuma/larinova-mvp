# Testing SOAP Note & Medical Codes Integration

## ✅ Setup Complete

The following has been implemented and deployed:

### 1. Database Migration
- Added `soap_note` (TEXT) column to `larinova_consultations`
- Added `medical_codes` (JSONB) column to `larinova_consultations`
- Migration file: `supabase/migrations/20260125000100_add_soap_medical_codes.sql`

### 2. API Endpoints Created

#### `/api/consultations/[id]/soap-note`
- **POST**: Generates SOAP note from consultation transcripts using Claude service
- **GET**: Retrieves saved SOAP note
- Location: `app/api/consultations/[id]/soap-note/route.ts`

#### `/api/consultations/[id]/medical-codes`
- **POST**: Extracts medical codes (ICD-10, SNOMED, CPT) from SOAP note
- **GET**: Retrieves saved medical codes
- Location: `app/api/consultations/[id]/medical-codes/route.ts`

### 3. UI Component
- **MedicalCodesView**: React component for displaying SOAP notes and medical codes
- Location: `components/consultation/MedicalCodesView.tsx`
- Features:
  - One-click documentation generation
  - Expandable SOAP note display
  - Color-coded medical codes (ICD-10: blue, SNOMED: green, CPT: purple)
  - Auto-saves to database

### 4. Integration
- Added to prescription page: `app/(protected)/consultations/[id]/prescription/page.tsx`

## 🧪 Manual Testing Steps

### Prerequisites
1. Make sure Next.js dev server is running: `npm run dev`
2. Ensure Claude service is running at `https://innominate-unalleviatingly-yasmin.ngrok-free.dev/`
3. Confirm `CLAUDE_SERVICE_API_KEY` is set in `.env` file

### Test Flow

1. **Login to the Application**
   - Navigate to `http://localhost:3000`
   - Login with your doctor account

2. **Start a Consultation**
   - Go to Patients page
   - Select a patient
   - Click "Start Consultation"

3. **Record Conversation**
   - Click "Start Recording" in the transcription section
   - Speak some medical dialogue (or use the browser's microphone)
   - Example dialogue:
     - Doctor: "What brings you in today?"
     - Patient: "I have been experiencing severe headaches for 3 days"
     - Doctor: "Let me check your blood pressure. It's 130/85"
     - Doctor: "This appears to be a migraine. I'll prescribe Sumatriptan"
   - Click "Stop Recording"

4. **Complete Consultation**
   - Click "Complete Consultation" button
   - You will be redirected to the prescription page

5. **Generate SOAP Note & Medical Codes**
   - On the prescription page, find the "Clinical Documentation & Coding" section
   - Click "Generate Documentation" button
   - Wait for processing (may take 30-60 seconds)
   - The SOAP note will appear first
   - Medical codes will be extracted automatically and displayed below

6. **Review Results**
   - Expand the SOAP note to see the generated clinical note
   - Click on each medical code section (ICD-10, SNOMED, CPT) to view details
   - Verify the codes match the medical content discussed

### Expected Results

#### SOAP Note Format
```
Subjective:
- Chief Complaint: [Patient's complaint]
- History of Present Illness: [Details]
...

Objective:
- Vital Signs: [If mentioned]
- Physical Examination: [Findings]
...

Assessment:
- Primary Diagnosis: [Diagnosis]
...

Plan:
- Medications: [Prescriptions]
- Follow-up: [Instructions]
```

#### Medical Codes
- **ICD-10**: Diagnosis codes (e.g., G43.909 for Migraine)
- **SNOMED**: Clinical terms (e.g., 37796009 for Migraine)
- **CPT**: Procedure codes (e.g., 99213 for Office Visit)

## 🔧 Troubleshooting

### Issue: "Failed to generate SOAP note"
- **Check**: Claude service is running and accessible
- **Check**: `CLAUDE_SERVICE_API_KEY` is correctly set
- **Check**: Network connectivity to ngrok URL

### Issue: "No transcripts found"
- **Check**: Recording was started and transcripts were saved
- **Check**: Browser has microphone permissions
- **Check**: Transcripts exist in database for the consultation

### Issue: "Unauthorized" error
- **Check**: User is logged in
- **Check**: User has access to the consultation
- **Check**: Session is still valid (not expired)

## 📊 Database Verification

To manually check if data was saved:

```sql
-- Check SOAP note
SELECT id, consultation_code, soap_note
FROM larinova_consultations
WHERE id = '<consultation-id>';

-- Check medical codes
SELECT id, consultation_code, medical_codes
FROM larinova_consultations
WHERE id = '<consultation-id>';

-- Check transcripts
SELECT speaker, text, timestamp_start
FROM larinova_transcripts
WHERE consultation_id = '<consultation-id>'
ORDER BY timestamp_start;
```

## 🎯 Test Data Created

The test script attempted to create:
- Consultation ID: `fad92360-c39c-47ab-9d06-f6217f5a8953`
- Consultation Code: `KC-2026-0008`
- 13 transcript segments about a migraine consultation

You can use this consultation ID to test the endpoints directly if needed.

## 📝 Next Steps

1. Test with real patient consultations
2. Verify SOAP note quality and accuracy
3. Validate medical codes are appropriate
4. Test different types of medical scenarios
5. Monitor Claude service response times
6. Optimize prompts if needed for better results

## 🔗 Useful Links

- Dev Server: http://localhost:3000
- Claude Service: https://innominate-unalleviatingly-yasmin.ngrok-free.dev/
- Prescription Page Template: http://localhost:3000/consultations/[id]/prescription
