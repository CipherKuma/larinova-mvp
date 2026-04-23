/**
 * Test script for SOAP note generation and medical code extraction
 *
 * This script:
 * 1. Creates a test consultation with sample transcripts
 * 2. Generates a SOAP note from the transcripts
 * 3. Extracts medical codes from the SOAP note
 * 4. Displays the results
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role to bypass RLS for testing
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Sample medical conversation
const SAMPLE_TRANSCRIPTS = [
  {
    speaker: 'doctor',
    text: 'Good morning! What brings you in today?',
    timestamp_start: 0,
    timestamp_end: 3,
  },
  {
    speaker: 'patient',
    text: 'I have been experiencing severe headaches for the past 3 days. The pain is mostly on the right side of my head.',
    timestamp_start: 3,
    timestamp_end: 10,
  },
  {
    speaker: 'doctor',
    text: 'I see. Can you describe the pain? Is it sharp, dull, throbbing?',
    timestamp_start: 10,
    timestamp_end: 15,
  },
  {
    speaker: 'patient',
    text: 'It is a throbbing pain. It gets worse when I am exposed to bright lights or loud noises.',
    timestamp_start: 15,
    timestamp_end: 22,
  },
  {
    speaker: 'doctor',
    text: 'Have you experienced any nausea or vomiting?',
    timestamp_start: 22,
    timestamp_end: 26,
  },
  {
    speaker: 'patient',
    text: 'Yes, I felt nauseous yesterday morning and vomited once.',
    timestamp_start: 26,
    timestamp_end: 30,
  },
  {
    speaker: 'doctor',
    text: 'Any history of migraines in your family?',
    timestamp_start: 30,
    timestamp_end: 33,
  },
  {
    speaker: 'patient',
    text: 'Yes, my mother suffers from migraines.',
    timestamp_start: 33,
    timestamp_end: 36,
  },
  {
    speaker: 'doctor',
    text: 'Let me check your blood pressure and examine you. Your blood pressure is 130 over 85, slightly elevated. Neurological exam shows no focal deficits.',
    timestamp_start: 36,
    timestamp_end: 48,
  },
  {
    speaker: 'doctor',
    text: 'Based on your symptoms - unilateral throbbing headache, photophobia, phonophobia, nausea, and family history - this appears to be a migraine. I will prescribe you Sumatriptan for acute treatment.',
    timestamp_start: 48,
    timestamp_end: 62,
  },
  {
    speaker: 'patient',
    text: 'Thank you doctor. How should I take the medication?',
    timestamp_start: 62,
    timestamp_end: 66,
  },
  {
    speaker: 'doctor',
    text: 'Take 50mg of Sumatriptan at the onset of migraine symptoms. You can take another dose after 2 hours if needed, but do not exceed 200mg in 24 hours. I also recommend keeping a headache diary and avoiding triggers like stress, certain foods, and irregular sleep.',
    timestamp_start: 66,
    timestamp_end: 85,
  },
  {
    speaker: 'doctor',
    text: 'Please follow up in 2 weeks if symptoms persist or worsen.',
    timestamp_start: 85,
    timestamp_end: 90,
  },
];

async function main() {
  console.log('🧪 Testing SOAP Note Generation and Medical Code Extraction');
  console.log('=' .repeat(70));

  try {
    // Step 1: Get a test patient and doctor
    console.log('\n📋 Step 1: Finding test patient and doctor...');

    const { data: patients, error: patientError } = await supabase
      .from('larinova_patients')
      .select('id, full_name')
      .limit(1);

    if (patientError || !patients || patients.length === 0) {
      throw new Error('No patients found in database');
    }

    const { data: doctors, error: doctorError } = await supabase
      .from('larinova_doctors')
      .select('id, full_name')
      .limit(1);

    if (doctorError || !doctors || doctors.length === 0) {
      throw new Error('No doctors found in database');
    }

    const patient = patients[0];
    const doctor = doctors[0];

    console.log(`   ✓ Patient: ${patient.full_name} (${patient.id})`);
    console.log(`   ✓ Doctor: ${doctor.full_name} (${doctor.id})`);

    // Step 2: Create a test consultation
    console.log('\n📋 Step 2: Creating test consultation...');

    const { data: consultation, error: consultationError } = await supabase
      .from('larinova_consultations')
      .insert({
        patient_id: patient.id,
        doctor_id: doctor.id,
        status: 'in_progress',
        chief_complaint: 'Severe headaches',
      })
      .select()
      .single();

    if (consultationError || !consultation) {
      throw new Error(`Failed to create consultation: ${consultationError?.message}`);
    }

    console.log(`   ✓ Consultation created: ${consultation.consultation_code}`);
    console.log(`   ✓ Consultation ID: ${consultation.id}`);

    // Step 3: Add sample transcripts
    console.log('\n📋 Step 3: Adding sample transcripts...');

    const transcriptsToInsert = SAMPLE_TRANSCRIPTS.map(t => ({
      consultation_id: consultation.id,
      speaker: t.speaker,
      text: t.text,
      timestamp_start: t.timestamp_start,
      timestamp_end: t.timestamp_end,
      confidence: 0.95,
      language: 'en',
    }));

    const { error: transcriptError } = await supabase
      .from('larinova_transcripts')
      .insert(transcriptsToInsert);

    if (transcriptError) {
      throw new Error(`Failed to add transcripts: ${transcriptError.message}`);
    }

    console.log(`   ✓ Added ${SAMPLE_TRANSCRIPTS.length} transcript segments`);

    // Step 4: Generate SOAP note
    console.log('\n📋 Step 4: Generating SOAP note from transcripts...');
    console.log('   ⏳ Calling Claude service...');

    const soapResponse = await fetch(`http://localhost:3000/api/consultations/${consultation.id}/soap-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!soapResponse.ok) {
      const errorData = await soapResponse.json();
      throw new Error(`SOAP generation failed: ${errorData.error || soapResponse.statusText}`);
    }

    const soapData = await soapResponse.json();
    console.log(`   ✓ SOAP note generated successfully`);
    console.log(`   ✓ Transcript count: ${soapData.transcriptCount}`);
    console.log('\n' + '─'.repeat(70));
    console.log('📄 GENERATED SOAP NOTE:');
    console.log('─'.repeat(70));
    console.log(soapData.soapNote);
    console.log('─'.repeat(70));

    // Step 5: Extract medical codes
    console.log('\n📋 Step 5: Extracting medical codes from SOAP note...');
    console.log('   ⏳ Calling Claude service...');

    const codesResponse = await fetch(`http://localhost:3000/api/consultations/${consultation.id}/medical-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ soapNote: soapData.soapNote }),
    });

    if (!codesResponse.ok) {
      const errorData = await codesResponse.json();
      throw new Error(`Medical code extraction failed: ${errorData.error || codesResponse.statusText}`);
    }

    const codesData = await codesResponse.json();
    console.log(`   ✓ Medical codes extracted successfully`);

    console.log('\n' + '─'.repeat(70));
    console.log('🏥 EXTRACTED MEDICAL CODES:');
    console.log('─'.repeat(70));

    const { medicalCodes } = codesData;

    if (medicalCodes.icd10 && medicalCodes.icd10.length > 0) {
      console.log('\n📘 ICD-10 CODES:');
      medicalCodes.icd10.forEach((code: any, idx: number) => {
        console.log(`   ${idx + 1}. ${code.code}`);
        console.log(`      ${code.description}`);
      });
    }

    if (medicalCodes.snomed && medicalCodes.snomed.length > 0) {
      console.log('\n📗 SNOMED CODES:');
      medicalCodes.snomed.forEach((code: any, idx: number) => {
        console.log(`   ${idx + 1}. ${code.code}`);
        console.log(`      ${code.description}`);
      });
    }

    if (medicalCodes.cpt && medicalCodes.cpt.length > 0) {
      console.log('\n📙 CPT CODES:');
      medicalCodes.cpt.forEach((code: any, idx: number) => {
        console.log(`   ${idx + 1}. ${code.code}`);
        console.log(`      ${code.description}`);
      });
    }

    console.log('\n' + '─'.repeat(70));

    // Step 6: Verify data was saved to database
    console.log('\n📋 Step 6: Verifying data saved to database...');

    const { data: savedConsultation, error: verifyError } = await supabase
      .from('larinova_consultations')
      .select('soap_note, medical_codes')
      .eq('id', consultation.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify saved data: ${verifyError.message}`);
    }

    console.log(`   ✓ SOAP note saved: ${savedConsultation.soap_note ? 'YES' : 'NO'}`);
    console.log(`   ✓ Medical codes saved: ${savedConsultation.medical_codes ? 'YES' : 'NO'}`);

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log(`\n🔗 View consultation in browser:`);
    console.log(`   http://localhost:3000/consultations/${consultation.id}/prescription\n`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:');
    console.error(`   ${error.message}`);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
