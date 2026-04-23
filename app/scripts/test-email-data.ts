/**
 * Test script to verify email automation data
 * Run with: npx tsx scripts/test-email-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailData() {
  console.log('🔍 Testing Email Automation Data\n');
  console.log('='.repeat(80) + '\n');

  // Test 1: Update prescription records with email_sent_at
  console.log('📝 Test 1: Updating prescription records with email_sent_at timestamps...');
  const { data: updatedPrescriptions, error: updateError } = await supabase
    .from('larinova_prescriptions')
    .update({ email_sent_at: new Date().toISOString() })
    .in('id', await supabase
      .from('larinova_prescriptions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(2)
      .then(res => res.data?.map(p => p.id) || [])
    )
    .select('prescription_code, email_sent_at');

  if (updateError) {
    console.error('   ❌ Error:', updateError.message);
  } else {
    console.log('   ✅ Updated prescriptions:');
    updatedPrescriptions?.forEach(p => {
      console.log(`      - ${p.prescription_code}: ${new Date(p.email_sent_at!).toLocaleString()}`);
    });
  }
  console.log();

  // Test 2: Query complete consultation data
  console.log('📋 Test 2: Fetching complete consultation data for email...');
  const { data: consultations, error: consultError } = await supabase
    .from('larinova_consultations')
    .select(`
      consultation_code,
      start_time,
      diagnosis,
      summary,
      status,
      patient:larinova_patients(full_name, email),
      doctor:larinova_doctors(full_name),
      prescription:larinova_prescriptions(
        prescription_code,
        doctor_notes,
        email_sent_at
      )
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3);

  if (consultError) {
    console.error('   ❌ Error:', consultError.message);
  } else {
    console.log(`   ✅ Found ${consultations?.length || 0} completed consultations:\n`);
    consultations?.forEach((c: any, idx: number) => {
      console.log(`   ${idx + 1}. Consultation: ${c.consultation_code}`);
      console.log(`      Patient: ${c.patient?.full_name} (${c.patient?.email})`);
      console.log(`      Doctor: Dr. ${c.doctor?.full_name}`);
      console.log(`      Date: ${new Date(c.start_time).toLocaleDateString()}`);
      console.log(`      Diagnosis: ${c.diagnosis || 'N/A'}`);
      console.log(`      Email Sent: ${c.prescription?.[0]?.email_sent_at ? '✓' : '✗'}`);
      console.log();
    });
  }

  // Test 3: Get prescription items for latest prescription
  console.log('💊 Test 3: Fetching prescription items for email template...');
  const { data: latestPrescription } = await supabase
    .from('larinova_prescriptions')
    .select('id, prescription_code')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestPrescription) {
    const { data: items, error: itemsError } = await supabase
      .from('larinova_prescription_items')
      .select('medicine_name, dosage, frequency, duration, instructions')
      .eq('prescription_id', latestPrescription.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('   ❌ Error:', itemsError.message);
    } else {
      console.log(`   ✅ Prescription ${latestPrescription.prescription_code} items:\n`);
      items?.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.medicine_name}`);
        console.log(`      Dosage: ${item.dosage}`);
        console.log(`      Frequency: ${item.frequency}`);
        console.log(`      Duration: ${item.duration}`);
        if (item.instructions) {
          console.log(`      Instructions: ${item.instructions}`);
        }
        console.log();
      });
    }
  } else {
    console.log('   ⚠️  No prescriptions found');
  }
  console.log();

  // Test 4: Check email sent status
  console.log('📊 Test 4: Email sent status for all prescriptions...');
  const { data: prescriptions, error: prescError } = await supabase
    .from('larinova_prescriptions')
    .select('prescription_code, email_sent_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (prescError) {
    console.error('   ❌ Error:', prescError.message);
  } else {
    console.log('   ✅ Recent prescriptions:\n');
    prescriptions?.forEach((p, idx) => {
      const status = p.email_sent_at ? '✓ Sent' : '✗ Pending';
      const sentAt = p.email_sent_at ? new Date(p.email_sent_at).toLocaleString() : 'N/A';
      console.log(`   ${idx + 1}. ${p.prescription_code}`);
      console.log(`      Status: ${status}`);
      console.log(`      Sent At: ${sentAt}`);
      console.log(`      Created: ${new Date(p.created_at).toLocaleString()}`);
      console.log();
    });
  }

  // Test 5: Generate email statistics
  console.log('📈 Test 5: Email statistics...');
  const { data: stats, error: statsError } = await supabase
    .from('larinova_prescriptions')
    .select('email_sent_at');

  if (statsError) {
    console.error('   ❌ Error:', statsError.message);
  } else {
    const total = stats?.length || 0;
    const sent = stats?.filter(p => p.email_sent_at).length || 0;
    const pending = total - sent;
    const successRate = total > 0 ? ((sent / total) * 100).toFixed(2) : '0.00';

    console.log('   ✅ Email Statistics:');
    console.log(`      Total Prescriptions: ${total}`);
    console.log(`      Emails Sent: ${sent}`);
    console.log(`      Emails Pending: ${pending}`);
    console.log(`      Success Rate: ${successRate}%`);
  }
  console.log();

  // Test 6: Complete consultation-to-email flow
  console.log('🔄 Test 6: Complete consultation-to-email flow verification...');
  const { data: flowData, error: flowError } = await supabase
    .from('larinova_consultations')
    .select(`
      consultation_code,
      status,
      patient:larinova_patients(full_name),
      prescription:larinova_prescriptions(
        prescription_code,
        email_sent_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (flowError) {
    console.error('   ❌ Error:', flowError.message);
  } else {
    console.log('   ✅ Recent consultation flow:\n');
    flowData?.forEach((c: any, idx: number) => {
      const emailStatus = c.prescription?.[0]?.email_sent_at ? '✓ Sent' : '✗ Pending';
      const prescCode = c.prescription?.[0]?.prescription_code || 'No prescription';
      console.log(`   ${idx + 1}. ${c.consultation_code}`);
      console.log(`      Patient: ${c.patient?.full_name}`);
      console.log(`      Status: ${c.status}`);
      console.log(`      Prescription: ${prescCode}`);
      console.log(`      Email: ${emailStatus}`);
      console.log();
    });
  }

  console.log('='.repeat(80));
  console.log('✅ Email automation data test completed!\n');
}

testEmailData().catch(console.error);
