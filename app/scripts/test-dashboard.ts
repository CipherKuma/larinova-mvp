import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testDashboard() {
  console.log('🧪 Testing Dashboard...\n');

  // Use service role client to check data
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if we have any doctors
  const { data: doctors, error: doctorsError } = await adminClient
    .from('larinova_doctors')
    .select('*')
    .limit(1);

  if (doctorsError) {
    console.error('❌ Error fetching doctors:', doctorsError);
    return;
  }

  if (!doctors || doctors.length === 0) {
    console.log('⚠️  No doctors found in database.');
    console.log('📝 Please sign up first at http://localhost:3001/sign-up\n');
    return;
  }

  const doctor = doctors[0];
  console.log(`✅ Found doctor: ${doctor.full_name} (${doctor.email})\n`);

  // Check patients count
  const { count: patientsCount } = await adminClient
    .from('larinova_patients')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total patients: ${patientsCount}`);

  // Check consultations
  const { count: consultationsCount } = await adminClient
    .from('larinova_consultations')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctor.id);

  console.log(`📅 Total consultations for this doctor: ${consultationsCount}`);

  // Check today's consultations
  const today = new Date().toISOString().split('T')[0];
  const { count: todayCount } = await adminClient
    .from('larinova_consultations')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctor.id)
    .gte('start_time', today);

  console.log(`📅 Today's consultations: ${todayCount}`);

  // List recent consultations
  const { data: recentConsultations } = await adminClient
    .from('larinova_consultations')
    .select(`
      id,
      start_time,
      status,
      larinova_patients (
        full_name,
        patient_code
      )
    `)
    .eq('doctor_id', doctor.id)
    .order('start_time', { ascending: false })
    .limit(5);

  if (recentConsultations && recentConsultations.length > 0) {
    console.log('\n📋 Recent consultations:');
    recentConsultations.forEach((consultation: any) => {
      const patient = consultation.larinova_patients;
      console.log(
        `   - ${patient.full_name} (${patient.patient_code}) - ${consultation.status} - ${new Date(consultation.start_time).toLocaleString()}`
      );
    });
  } else {
    console.log('\n📋 No recent consultations found.');
  }

  console.log('\n✨ Dashboard test complete!');
  console.log(`\n🌐 View dashboard at: http://localhost:3001/`);
  console.log(`   Sign in with: ${doctor.email}\n`);
}

testDashboard();
