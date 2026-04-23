/**
 * Check database for existing data
 * Run with: npx tsx scripts/check-db-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking Database Data\n');

  // Check consultations
  const { data: consultations, error: cError } = await supabase
    .from('larinova_consultations')
    .select('id, consultation_code, status')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('📋 Consultations:');
  if (cError) {
    console.error('   ❌ Error:', cError.message);
  } else {
    console.log(`   Total found: ${consultations?.length || 0}`);
    consultations?.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.consultation_code} - Status: ${c.status}`);
    });
  }
  console.log();

  // Check prescriptions
  const { data: prescriptions, error: pError } = await supabase
    .from('larinova_prescriptions')
    .select('id, prescription_code, email_sent_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('💊 Prescriptions:');
  if (pError) {
    console.error('   ❌ Error:', pError.message);
  } else {
    console.log(`   Total found: ${prescriptions?.length || 0}`);
    prescriptions?.forEach((p, idx) => {
      const emailStatus = p.email_sent_at ? '✓ Sent' : '✗ Not sent';
      console.log(`   ${idx + 1}. ${p.prescription_code} - Email: ${emailStatus}`);
    });
  }
  console.log();

  // Check patients
  const { data: patients, error: patError } = await supabase
    .from('larinova_patients')
    .select('id, full_name, email')
    .limit(5);

  console.log('👥 Patients:');
  if (patError) {
    console.error('   ❌ Error:', patError.message);
  } else {
    console.log(`   Total found: ${patients?.length || 0}`);
    patients?.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.full_name} - ${p.email}`);
    });
  }
  console.log();
}

checkData().catch(console.error);
