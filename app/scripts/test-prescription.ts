import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testMedicineSearch() {
  console.log("\n=== MEDICINE SEARCH TESTS ===\n");

  // Test 1: Search for antibiotics
  console.log("1. Searching for antibiotics containing 'amox':");
  const { data: amoxResults, error: amoxError } = await supabase
    .from("larinova_medicines")
    .select("name, generic_name, category, common_dosages")
    .or("name.ilike.%amox%,generic_name.ilike.%amox%")
    .eq("is_active", true)
    .limit(5);

  if (amoxError) {
    console.error("Error:", amoxError);
  } else {
    console.table(amoxResults);
  }

  // Test 2: Search for painkillers
  console.log("\n2. Searching for painkillers:");
  const { data: painkillers, error: painError } = await supabase
    .from("larinova_medicines")
    .select("name, generic_name, category")
    .eq("category", "painkiller")
    .eq("is_active", true);

  if (painError) {
    console.error("Error:", painError);
  } else {
    console.table(painkillers);
  }

  // Test 3: Get medicine counts by category
  console.log("\n3. Medicine counts by category:");
  const { data: categories, error: catError } = await supabase
    .from("larinova_medicines")
    .select("category")
    .eq("is_active", true);

  if (catError) {
    console.error("Error:", catError);
  } else {
    const counts = categories.reduce((acc: Record<string, number>, med) => {
      acc[med.category] = (acc[med.category] || 0) + 1;
      return acc;
    }, {});
    console.table(
      Object.entries(counts)
        .map(([category, count]) => ({ category, medicine_count: count }))
        .sort((a, b) => b.medicine_count - a.medicine_count)
    );
  }
}

async function createTestPrescription() {
  console.log("\n=== CREATING TEST PRESCRIPTION ===\n");

  // Get a completed consultation
  const { data: consultation, error: consultError } = await supabase
    .from("larinova_consultations")
    .select("id, patient_id, doctor_id, consultation_code")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (consultError || !consultation) {
    console.error("No completed consultation found:", consultError);
    return null;
  }

  console.log("Using consultation:", consultation.consultation_code);

  // Create prescription
  const { data: prescription, error: prescError } = await supabase
    .from("larinova_prescriptions")
    .insert({
      consultation_id: consultation.id,
      patient_id: consultation.patient_id,
      doctor_id: consultation.doctor_id,
      doctor_notes:
        "Patient advised to take medications with food. Follow up in 1 week if symptoms persist.",
    })
    .select()
    .single();

  if (prescError || !prescription) {
    console.error("Error creating prescription:", prescError);
    return null;
  }

  console.log("Created prescription:", prescription.prescription_code);

  // Get medicine IDs
  const { data: medicines } = await supabase
    .from("larinova_medicines")
    .select("id, name")
    .in("name", ["Amoxicillin", "Paracetamol", "Ibuprofen"]);

  if (!medicines || medicines.length === 0) {
    console.error("Medicines not found");
    return prescription.id;
  }

  // Create prescription items
  const items = [
    {
      prescription_id: prescription.id,
      medicine_id: medicines.find((m) => m.name === "Amoxicillin")?.id || medicines[0].id,
      medicine_name: "Amoxicillin",
      dosage: "500mg",
      frequency: "Twice daily",
      duration: "7 days",
      instructions: "Take with food",
    },
    {
      prescription_id: prescription.id,
      medicine_id: medicines.find((m) => m.name === "Paracetamol")?.id || medicines[0].id,
      medicine_name: "Paracetamol",
      dosage: "500mg",
      frequency: "As needed (max 4 times daily)",
      duration: "5 days",
      instructions: "Do not exceed 2000mg per day",
    },
    {
      prescription_id: prescription.id,
      medicine_id: medicines.find((m) => m.name === "Ibuprofen")?.id || medicines[0].id,
      medicine_name: "Ibuprofen",
      dosage: "400mg",
      frequency: "Three times daily",
      duration: "5 days",
      instructions: "Take after meals",
    },
  ];

  const { error: itemsError } = await supabase
    .from("larinova_prescription_items")
    .insert(items);

  if (itemsError) {
    console.error("Error creating prescription items:", itemsError);
  } else {
    console.log("Created prescription items:");
    console.table(items.map((i) => ({
      medicine: i.medicine_name,
      dosage: i.dosage,
      frequency: i.frequency,
      duration: i.duration,
    })));
  }

  return prescription.id;
}

async function verifyPrescription(prescriptionId?: string) {
  console.log("\n=== PRESCRIPTION VERIFICATION ===\n");

  // Get latest prescription
  const { data: prescription, error: prescError } = await supabase
    .from("larinova_prescriptions")
    .select(`
      prescription_code,
      doctor_notes,
      created_at,
      patient:larinova_patients(full_name),
      doctor:larinova_doctors(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (prescError || !prescription) {
    console.error("Error fetching prescription:", prescError);
    return;
  }

  console.log("Latest Prescription:");
  const prescData: any = prescription;
  console.log({
    prescription_code: prescData.prescription_code,
    patient_name: Array.isArray(prescData.patient) ? prescData.patient[0]?.full_name : prescData.patient?.full_name,
    doctor_name: Array.isArray(prescData.doctor) ? prescData.doctor[0]?.full_name : prescData.doctor?.full_name,
    doctor_notes: prescData.doctor_notes,
    created_at: new Date(prescData.created_at).toLocaleString(),
  });

  // Get prescription items
  const { data: items, error: itemsError } = await supabase
    .from("larinova_prescription_items")
    .select("medicine_name, dosage, frequency, duration, instructions")
    .eq("prescription_id", prescriptionId || prescription.prescription_code)
    .order("created_at", { ascending: true })
    .limit(10);

  if (itemsError) {
    console.error("Error fetching items:", itemsError);
  } else {
    console.log("\nPrescription Items:");
    console.table(items);
  }
}

async function getPrescriptionStatistics() {
  console.log("\n=== PRESCRIPTION STATISTICS ===\n");

  const { data: prescriptions } = await supabase
    .from("larinova_prescriptions")
    .select("id");

  const { data: items } = await supabase
    .from("larinova_prescription_items")
    .select("prescription_id");

  const totalPrescriptions = prescriptions?.length || 0;
  const totalItems = items?.length || 0;
  const avgItemsPerPrescription = totalPrescriptions > 0 ? totalItems / totalPrescriptions : 0;

  console.log({
    total_prescriptions: totalPrescriptions,
    total_medicine_items: totalItems,
    avg_medicines_per_prescription: avgItemsPerPrescription.toFixed(2),
  });
}

async function verifyConsultationStatus() {
  console.log("\n=== CONSULTATION STATUS VERIFICATION ===\n");

  const { data: consultations, error } = await supabase
    .from("larinova_consultations")
    .select(`
      consultation_code,
      status,
      prescription:larinova_prescriptions(prescription_code)
    `)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.table(
      consultations?.map((c: any) => ({
        consultation_code: c.consultation_code,
        status: c.status,
        has_prescription: c.prescription ? "Yes" : "No",
        prescription_code: c.prescription?.prescription_code || "N/A",
      }))
    );
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("PRESCRIPTION FEATURE AUTO-TEST");
  console.log("=".repeat(60));

  await testMedicineSearch();
  const prescriptionId = await createTestPrescription();
  await verifyPrescription(prescriptionId || undefined);
  await getPrescriptionStatistics();
  await verifyConsultationStatus();

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETED");
  console.log("=".repeat(60));
}

main().catch(console.error);
