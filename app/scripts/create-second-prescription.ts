import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSecondPrescription() {
  console.log("\n=== CREATING SECOND TEST PRESCRIPTION ===\n");

  // Get a completed consultation that doesn't have a prescription yet
  const { data: consultation, error: consultError } = await supabase
    .from("larinova_consultations")
    .select("id, patient_id, doctor_id, consultation_code")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10);

  if (consultError || !consultation || consultation.length === 0) {
    console.error("No completed consultation found:", consultError);
    return;
  }

  // Find one without prescription
  const { data: existingPrescriptions } = await supabase
    .from("larinova_prescriptions")
    .select("consultation_id");

  const consultationWithoutPrescription = consultation.find(
    (c) => !existingPrescriptions?.some((p) => p.consultation_id === c.id)
  );

  if (!consultationWithoutPrescription) {
    console.log("All consultations already have prescriptions");
    return;
  }

  console.log("Using consultation:", consultationWithoutPrescription.consultation_code);

  // Create prescription
  const { data: prescription, error: prescError } = await supabase
    .from("larinova_prescriptions")
    .insert({
      consultation_id: consultationWithoutPrescription.id,
      patient_id: consultationWithoutPrescription.patient_id,
      doctor_id: consultationWithoutPrescription.doctor_id,
      doctor_notes: "Rest and hydration recommended. Avoid strenuous activity.",
    })
    .select()
    .single();

  if (prescError || !prescription) {
    console.error("Error creating prescription:", prescError);
    return;
  }

  console.log("Created prescription:", prescription.prescription_code);

  // Get Cetirizine
  const { data: medicine } = await supabase
    .from("larinova_medicines")
    .select("id, name")
    .eq("name", "Cetirizine")
    .single();

  if (!medicine) {
    console.error("Cetirizine not found");
    return;
  }

  // Create prescription item
  const { error: itemError } = await supabase
    .from("larinova_prescription_items")
    .insert({
      prescription_id: prescription.id,
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      dosage: "10mg",
      frequency: "Once daily",
      duration: "14 days",
      instructions: "Take before bed",
    });

  if (itemError) {
    console.error("Error creating prescription item:", itemError);
  } else {
    console.log("Created prescription item:");
    console.table([
      {
        medicine: medicine.name,
        dosage: "10mg",
        frequency: "Once daily",
        duration: "14 days",
      },
    ]);
  }

  // Get final statistics
  console.log("\n=== FINAL PRESCRIPTION STATISTICS ===\n");

  const { data: allPrescriptions } = await supabase
    .from("larinova_prescriptions")
    .select(`
      prescription_code,
      created_at,
      items:larinova_prescription_items(medicine_name, dosage)
    `)
    .order("created_at", { ascending: false });

  console.log("Total prescriptions:", allPrescriptions?.length);
  console.log("\nAll prescriptions with items:");
  allPrescriptions?.forEach((p: any) => {
    console.log(`\n${p.prescription_code} (${new Date(p.created_at).toLocaleString()}):`);
    p.items.forEach((item: any) => {
      console.log(`  - ${item.medicine_name} ${item.dosage}`);
    });
  });
}

createSecondPrescription().catch(console.error);
