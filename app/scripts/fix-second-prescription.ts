import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixSecondPrescription() {
  // Get the second prescription
  const { data: prescription } = await supabase
    .from("larinova_prescriptions")
    .select("id, prescription_code")
    .eq("prescription_code", "KRX-2026-0002")
    .single();

  if (!prescription) {
    console.error("Prescription not found");
    return;
  }

  // Get any Cetirizine or antihistamine
  const { data: medicines } = await supabase
    .from("larinova_medicines")
    .select("id, name, category")
    .or("name.ilike.%cetirizine%,category.eq.antihistamine")
    .limit(1);

  if (!medicines || medicines.length === 0) {
    console.error("No antihistamine found, using first available medicine");
    const { data: anyMedicine } = await supabase
      .from("larinova_medicines")
      .select("id, name")
      .limit(1)
      .single();

    if (anyMedicine) {
      const { error } = await supabase.from("larinova_prescription_items").insert({
        prescription_id: prescription.id,
        medicine_id: anyMedicine.id,
        medicine_name: anyMedicine.name,
        dosage: "10mg",
        frequency: "Once daily",
        duration: "14 days",
        instructions: "Take before bed",
      });

      if (!error) {
        console.log("Created item with:", anyMedicine.name);
      }
    }
    return;
  }

  const medicine = medicines[0];

  const { error } = await supabase.from("larinova_prescription_items").insert({
    prescription_id: prescription.id,
    medicine_id: medicine.id,
    medicine_name: medicine.name,
    dosage: "10mg",
    frequency: "Once daily",
    duration: "14 days",
    instructions: "Take before bed",
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Successfully added item:", medicine.name);
  }

  // Show final statistics
  const { data: allPrescriptions } = await supabase
    .from("larinova_prescriptions")
    .select(`
      prescription_code,
      created_at,
      items:larinova_prescription_items(medicine_name, dosage, frequency, duration)
    `)
    .order("created_at", { ascending: false });

  console.log("\n=== ALL PRESCRIPTIONS ===\n");
  allPrescriptions?.forEach((p: any) => {
    console.log(`${p.prescription_code} (${new Date(p.created_at).toLocaleString()}):`);
    if (p.items && p.items.length > 0) {
      p.items.forEach((item: any) => {
        console.log(
          `  - ${item.medicine_name} ${item.dosage}, ${item.frequency}, ${item.duration}`
        );
      });
    } else {
      console.log("  (no items)");
    }
    console.log();
  });

  // Calculate statistics
  const { data: items } = await supabase
    .from("larinova_prescription_items")
    .select("prescription_id");

  const totalPrescriptions = allPrescriptions?.length || 0;
  const totalItems = items?.length || 0;
  const avgItems = totalPrescriptions > 0 ? totalItems / totalPrescriptions : 0;

  console.log("=== STATISTICS ===");
  console.log(`Total prescriptions: ${totalPrescriptions}`);
  console.log(`Total medicine items: ${totalItems}`);
  console.log(`Average medicines per prescription: ${avgItems.toFixed(2)}`);
}

fixSecondPrescription().catch(console.error);
