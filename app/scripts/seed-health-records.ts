import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Health Record Metadata Structure:
 * {
 *   sections: [
 *     {
 *       name: "Section Name",
 *       fields: [
 *         { key: "Field Name", value: "Value", unit: "Unit (optional)" }
 *       ]
 *     }
 *   ]
 * }
 */

const healthRecordsData = [
  // Lab Result - Complete Blood Count
  {
    record_type: 'lab_result',
    title: 'Complete Blood Count (CBC)',
    description: 'Routine blood work to assess overall health',
    record_date: '2026-01-20',
    severity: 'low',
    metadata: {
      sections: [
        {
          name: 'Red Blood Cells',
          fields: [
            { key: 'RBC Count', value: '4.8', unit: 'million cells/mcL' },
            { key: 'Hemoglobin', value: '14.5', unit: 'g/dL' },
            { key: 'Hematocrit', value: '42', unit: '%' },
            { key: 'MCV', value: '88', unit: 'fL' },
            { key: 'MCH', value: '30', unit: 'pg' },
            { key: 'MCHC', value: '34', unit: 'g/dL' },
          ]
        },
        {
          name: 'White Blood Cells',
          fields: [
            { key: 'WBC Count', value: '7.2', unit: 'thousand cells/mcL' },
            { key: 'Neutrophils', value: '60', unit: '%' },
            { key: 'Lymphocytes', value: '30', unit: '%' },
            { key: 'Monocytes', value: '7', unit: '%' },
            { key: 'Eosinophils', value: '2', unit: '%' },
            { key: 'Basophils', value: '1', unit: '%' },
          ]
        },
        {
          name: 'Platelets',
          fields: [
            { key: 'Platelet Count', value: '250', unit: 'thousand cells/mcL' },
            { key: 'MPV', value: '10.5', unit: 'fL' },
          ]
        }
      ]
    }
  },
  // Lab Result - Lipid Panel
  {
    record_type: 'lab_result',
    title: 'Lipid Panel',
    description: 'Cholesterol and triglyceride levels',
    record_date: '2026-01-18',
    severity: 'medium',
    metadata: {
      sections: [
        {
          name: 'Cholesterol Levels',
          fields: [
            { key: 'Total Cholesterol', value: '210', unit: 'mg/dL' },
            { key: 'LDL Cholesterol', value: '135', unit: 'mg/dL' },
            { key: 'HDL Cholesterol', value: '45', unit: 'mg/dL' },
            { key: 'Triglycerides', value: '150', unit: 'mg/dL' },
            { key: 'VLDL Cholesterol', value: '30', unit: 'mg/dL' },
          ]
        },
        {
          name: 'Risk Assessment',
          fields: [
            { key: 'Total/HDL Ratio', value: '4.7', unit: '' },
            { key: 'Risk Level', value: 'Moderate', unit: '' },
          ]
        }
      ]
    }
  },
  // Lab Result - Metabolic Panel
  {
    record_type: 'lab_result',
    title: 'Comprehensive Metabolic Panel',
    description: 'Kidney and liver function tests',
    record_date: '2026-01-15',
    severity: 'low',
    metadata: {
      sections: [
        {
          name: 'Kidney Function',
          fields: [
            { key: 'Creatinine', value: '0.9', unit: 'mg/dL' },
            { key: 'BUN', value: '15', unit: 'mg/dL' },
            { key: 'eGFR', value: '95', unit: 'mL/min/1.73m²' },
            { key: 'BUN/Creatinine Ratio', value: '17', unit: '' },
          ]
        },
        {
          name: 'Liver Function',
          fields: [
            { key: 'ALT', value: '28', unit: 'U/L' },
            { key: 'AST', value: '25', unit: 'U/L' },
            { key: 'Alkaline Phosphatase', value: '70', unit: 'U/L' },
            { key: 'Total Bilirubin', value: '0.8', unit: 'mg/dL' },
            { key: 'Albumin', value: '4.2', unit: 'g/dL' },
          ]
        },
        {
          name: 'Electrolytes',
          fields: [
            { key: 'Sodium', value: '140', unit: 'mEq/L' },
            { key: 'Potassium', value: '4.2', unit: 'mEq/L' },
            { key: 'Chloride', value: '102', unit: 'mEq/L' },
            { key: 'CO2', value: '25', unit: 'mEq/L' },
          ]
        },
        {
          name: 'Glucose',
          fields: [
            { key: 'Fasting Glucose', value: '95', unit: 'mg/dL' },
            { key: 'Calcium', value: '9.5', unit: 'mg/dL' },
          ]
        }
      ]
    }
  },
  // Lab Result - Thyroid Panel
  {
    record_type: 'lab_result',
    title: 'Thyroid Function Test',
    description: 'Thyroid hormone levels',
    record_date: '2026-01-12',
    severity: 'low',
    metadata: {
      sections: [
        {
          name: 'Thyroid Hormones',
          fields: [
            { key: 'TSH', value: '2.5', unit: 'mIU/L' },
            { key: 'Free T4', value: '1.2', unit: 'ng/dL' },
            { key: 'Free T3', value: '3.1', unit: 'pg/mL' },
            { key: 'Total T4', value: '8.5', unit: 'mcg/dL' },
          ]
        }
      ]
    }
  },
  // Diagnosis - Hypertension
  {
    record_type: 'diagnosis',
    title: 'Hypertension (Stage 1)',
    description: 'Elevated blood pressure requiring monitoring and lifestyle modifications',
    record_date: '2026-01-10',
    severity: 'medium',
    metadata: {
      sections: [
        {
          name: 'Blood Pressure Readings',
          fields: [
            { key: 'Systolic', value: '145', unit: 'mmHg' },
            { key: 'Diastolic', value: '92', unit: 'mmHg' },
            { key: 'Heart Rate', value: '78', unit: 'bpm' },
          ]
        },
        {
          name: 'Classification',
          fields: [
            { key: 'Stage', value: 'Stage 1 Hypertension', unit: '' },
            { key: 'Risk Category', value: 'Moderate', unit: '' },
          ]
        }
      ]
    }
  },
  // Vaccination
  {
    record_type: 'vaccination',
    title: 'Influenza Vaccine',
    description: 'Annual flu shot',
    record_date: '2025-11-15',
    severity: null,
    metadata: {
      sections: [
        {
          name: 'Vaccine Details',
          fields: [
            { key: 'Vaccine Name', value: 'Quadrivalent Influenza Vaccine', unit: '' },
            { key: 'Manufacturer', value: 'Generic Pharma', unit: '' },
            { key: 'Lot Number', value: 'FLU2025-1234', unit: '' },
            { key: 'Dose', value: '0.5', unit: 'mL' },
            { key: 'Route', value: 'Intramuscular', unit: '' },
            { key: 'Site', value: 'Left Deltoid', unit: '' },
          ]
        },
        {
          name: 'Next Dose',
          fields: [
            { key: 'Due Date', value: 'November 2026', unit: '' },
          ]
        }
      ]
    }
  },
  // Allergy
  {
    record_type: 'allergy',
    title: 'Penicillin Allergy',
    description: 'Severe allergic reaction to penicillin-based antibiotics',
    record_date: '2020-03-15',
    severity: 'high',
    metadata: {
      sections: [
        {
          name: 'Allergen Information',
          fields: [
            { key: 'Allergen', value: 'Penicillin', unit: '' },
            { key: 'Allergen Type', value: 'Medication', unit: '' },
            { key: 'Severity', value: 'Severe', unit: '' },
          ]
        },
        {
          name: 'Reaction Details',
          fields: [
            { key: 'Symptoms', value: 'Hives, difficulty breathing, swelling', unit: '' },
            { key: 'Onset Time', value: 'Within 30 minutes', unit: '' },
            { key: 'Treatment Required', value: 'Epinephrine, antihistamines', unit: '' },
          ]
        },
        {
          name: 'Cross-Reactivity',
          fields: [
            { key: 'Related Allergens', value: 'Amoxicillin, Ampicillin, Cephalosporins', unit: '' },
          ]
        }
      ]
    }
  },
  // Chronic Condition - Diabetes
  {
    record_type: 'chronic_condition',
    title: 'Type 2 Diabetes Mellitus',
    description: 'Managed with lifestyle modifications and medication',
    record_date: '2022-06-20',
    severity: 'medium',
    metadata: {
      sections: [
        {
          name: 'Current Status',
          fields: [
            { key: 'HbA1c', value: '6.8', unit: '%' },
            { key: 'Fasting Glucose', value: '120', unit: 'mg/dL' },
            { key: 'Control Level', value: 'Good', unit: '' },
          ]
        },
        {
          name: 'Management',
          fields: [
            { key: 'Current Medication', value: 'Metformin 1000mg', unit: '' },
            { key: 'Frequency', value: 'Twice daily', unit: '' },
            { key: 'Diet Plan', value: 'Low carb, Mediterranean', unit: '' },
            { key: 'Exercise', value: '30 minutes daily walking', unit: '' },
          ]
        },
        {
          name: 'Monitoring',
          fields: [
            { key: 'Glucose Monitoring', value: 'Daily fasting checks', unit: '' },
            { key: 'HbA1c Check', value: 'Every 3 months', unit: '' },
            { key: 'Last Eye Exam', value: 'December 2025', unit: '' },
          ]
        }
      ]
    }
  },
  // Procedure
  {
    record_type: 'procedure',
    title: 'Colonoscopy',
    description: 'Routine screening colonoscopy',
    record_date: '2025-08-10',
    severity: 'low',
    metadata: {
      sections: [
        {
          name: 'Procedure Details',
          fields: [
            { key: 'Procedure Type', value: 'Diagnostic Colonoscopy', unit: '' },
            { key: 'Indication', value: 'Routine screening', unit: '' },
            { key: 'Anesthesia', value: 'Conscious sedation', unit: '' },
            { key: 'Duration', value: '45', unit: 'minutes' },
          ]
        },
        {
          name: 'Findings',
          fields: [
            { key: 'Result', value: 'Normal', unit: '' },
            { key: 'Polyps Found', value: '0', unit: '' },
            { key: 'Biopsies Taken', value: 'None', unit: '' },
            { key: 'Quality of Prep', value: 'Excellent', unit: '' },
          ]
        },
        {
          name: 'Follow-up',
          fields: [
            { key: 'Next Screening', value: 'August 2030', unit: '' },
            { key: 'Recommendations', value: 'Continue routine screening', unit: '' },
          ]
        }
      ]
    }
  },
  // Vital Signs Monitoring
  {
    record_type: 'other',
    title: 'Monthly Vital Signs Check',
    description: 'Routine monthly monitoring of vital signs',
    record_date: '2026-01-22',
    severity: null,
    metadata: {
      sections: [
        {
          name: 'Vital Signs',
          fields: [
            { key: 'Blood Pressure', value: '138/88', unit: 'mmHg' },
            { key: 'Heart Rate', value: '72', unit: 'bpm' },
            { key: 'Temperature', value: '98.6', unit: '°F' },
            { key: 'Respiratory Rate', value: '16', unit: 'breaths/min' },
            { key: 'Oxygen Saturation', value: '98', unit: '%' },
          ]
        },
        {
          name: 'Physical Measurements',
          fields: [
            { key: 'Weight', value: '165', unit: 'lbs' },
            { key: 'Height', value: '5\'8"', unit: '' },
            { key: 'BMI', value: '25.1', unit: 'kg/m²' },
            { key: 'Waist Circumference', value: '36', unit: 'inches' },
          ]
        }
      ]
    }
  }
];

async function seedHealthRecords() {
  console.log('🌱 Starting health records seeding...');

  // Get the first patient from the database
  const { data: patients, error: patientsError } = await supabase
    .from('larinova_patients')
    .select('id, full_name, patient_code')
    .limit(3);

  if (patientsError || !patients || patients.length === 0) {
    console.error('❌ Error: No patients found. Please seed patients first.');
    return;
  }

  console.log(`✅ Found ${patients.length} patients`);

  // Get the first doctor
  const { data: doctors, error: doctorsError } = await supabase
    .from('larinova_doctors')
    .select('id')
    .limit(1);

  if (doctorsError || !doctors || doctors.length === 0) {
    console.error('❌ Error: No doctors found.');
    return;
  }

  const doctorId = doctors[0].id;

  // Distribute health records across patients
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    console.log(`\n📋 Adding health records for patient: ${patient.full_name} (${patient.patient_code})`);

    // Give each patient a subset of health records
    const recordsForPatient = healthRecordsData.slice(
      i * 3,
      Math.min((i + 1) * 3 + 1, healthRecordsData.length)
    );

    for (const record of recordsForPatient) {
      const { error } = await supabase
        .from('larinova_health_records')
        .insert({
          patient_id: patient.id,
          doctor_id: doctorId,
          ...record
        });

      if (error) {
        console.error(`  ❌ Error adding record "${record.title}":`, error.message);
      } else {
        console.log(`  ✅ Added: ${record.title}`);
      }
    }
  }

  console.log('\n✨ Health records seeding completed!');
}

seedHealthRecords()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
