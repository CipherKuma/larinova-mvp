import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  // Insert test patients
  const { data: patients, error: patientsError } = await supabase
    .from('larinova_patients')
    .insert([
      {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        blood_group: 'O+',
        gender: 'male',
      },
      {
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        blood_group: 'A+',
        gender: 'female',
      },
      {
        full_name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1234567892',
        blood_group: 'B+',
        gender: 'male',
      },
    ])
    .select();

  if (patientsError) {
    console.error('❌ Error inserting patients:', patientsError);
    process.exit(1);
  }

  console.log('✅ Successfully inserted patients:');
  patients?.forEach((patient: any) => {
    console.log(`   - ${patient.full_name} (${patient.patient_code})`);
  });

  // Verify total count
  const { count, error: countError } = await supabase
    .from('larinova_patients')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting patients:', countError);
  } else {
    console.log(`\n📊 Total patients in database: ${count}`);
  }

  // Display all patients
  const { data: allPatients, error: fetchError } = await supabase
    .from('larinova_patients')
    .select('patient_code, full_name, email')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching patients:', fetchError);
  } else {
    console.log('\n📋 All patients:');
    allPatients?.forEach((patient: any) => {
      console.log(
        `   ${patient.patient_code} - ${patient.full_name} (${patient.email})`
      );
    });
  }

  // Insert medicines
  console.log('\n💊 Seeding medicines...');
  const { data: medicines, error: medicinesError } = await supabase
    .from('larinova_medicines')
    .insert([
      {
        name: 'Amoxicillin',
        generic_name: 'Amoxicillin',
        category: 'antibiotic',
        common_dosages: ['250mg', '500mg'],
        is_active: true,
      },
      {
        name: 'Paracetamol',
        generic_name: 'Acetaminophen',
        category: 'painkiller',
        common_dosages: ['500mg', '1000mg'],
        is_active: true,
      },
      {
        name: 'Ibuprofen',
        generic_name: 'Ibuprofen',
        category: 'painkiller',
        common_dosages: ['200mg', '400mg', '600mg'],
        is_active: true,
      },
      {
        name: 'Cetirizine',
        generic_name: 'Cetirizine',
        category: 'antihistamine',
        common_dosages: ['5mg', '10mg'],
        is_active: true,
      },
      {
        name: 'Amoxicillin-Clavulanate',
        generic_name: 'Amoxicillin and Clavulanate Potassium',
        category: 'antibiotic',
        common_dosages: ['500mg/125mg', '875mg/125mg'],
        is_active: true,
      },
    ])
    .select();

  if (medicinesError) {
    console.error('❌ Error inserting medicines:', medicinesError);
  } else {
    console.log('✅ Successfully inserted medicines:');
    medicines?.forEach((med: any) => {
      console.log(`   - ${med.name} (${med.category})`);
    });
  }

  // Insert doctors
  console.log('\n👨‍⚕️ Seeding doctors...');
  const { data: doctors, error: doctorsError } = await supabase
    .from('larinova_doctors')
    .insert([
      {
        full_name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        phone: '+1234567800',
        specialization: 'General Medicine',
      },
      {
        full_name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        phone: '+1234567801',
        specialization: 'Pediatrics',
      },
    ])
    .select();

  if (doctorsError) {
    console.error('❌ Error inserting doctors:', doctorsError);
  } else {
    console.log('✅ Successfully inserted doctors:');
    doctors?.forEach((doc: any) => {
      console.log(`   - ${doc.full_name} (${doc.specialization})`);
    });
  }

  // Insert consultations
  if (patients && doctors && patients.length > 0 && doctors.length > 0) {
    console.log('\n🏥 Seeding consultations...');
    const { data: consultations, error: consultationsError } = await supabase
      .from('larinova_consultations')
      .insert([
        {
          patient_id: patients[0].id,
          doctor_id: doctors[0].id,
          status: 'completed',
          chief_complaint: 'Fever and sore throat',
          diagnosis: 'Acute pharyngitis',
          summary: 'Patient presented with fever and sore throat for 2 days.',
        },
        {
          patient_id: patients[1].id,
          doctor_id: doctors[1].id,
          status: 'completed',
          chief_complaint: 'Headache and body ache',
          diagnosis: 'Viral fever',
          summary: 'Patient has been experiencing headache and body ache.',
        },
      ])
      .select();

    if (consultationsError) {
      console.error('❌ Error inserting consultations:', consultationsError);
    } else {
      console.log('✅ Successfully inserted consultations:');
      consultations?.forEach((cons: any) => {
        console.log(`   - ${cons.consultation_code} (${cons.status})`);
      });
    }
  }

  console.log('\n✨ Seeding complete!');
}

seedTestData();
