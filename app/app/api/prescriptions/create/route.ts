import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  route: string;
  quantity: number | null;
  foodTiming: string;
}

interface PrescriptionRequest {
  consultationId: string;
  patientId: string;
  doctorId: string;
  doctorNotes: string;
  diagnosis: string;
  allergyWarnings: string | null;
  followUpDate: string | null;
  medicines: PrescriptionItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body: PrescriptionRequest = await request.json();
    const {
      consultationId,
      patientId,
      doctorId,
      doctorNotes,
      diagnosis,
      allergyWarnings,
      followUpDate,
      medicines,
    } = body;

    if (
      !consultationId ||
      !patientId ||
      !doctorId ||
      !medicines ||
      medicines.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Create prescription with enhanced fields
    const { data: prescription, error: prescriptionError } = await supabase
      .from("larinova_prescriptions")
      .insert({
        consultation_id: consultationId,
        patient_id: patientId,
        doctor_id: doctorId,
        doctor_notes: doctorNotes,
        diagnosis: diagnosis || null,
        allergy_warnings: allergyWarnings || null,
        follow_up_date: followUpDate || null,
      })
      .select()
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: "Failed to create prescription" },
        { status: 500 },
      );
    }

    // Insert prescription items with enhanced fields
    const prescriptionItems = medicines.map((medicine) => ({
      prescription_id: prescription.id,
      medicine_id: medicine.medicineId,
      medicine_name: medicine.medicineName,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
      instructions: medicine.instructions,
      route: medicine.route || null,
      quantity: medicine.quantity || null,
      food_timing: medicine.foodTiming || null,
    }));

    const { error: itemsError } = await supabase
      .from("larinova_prescription_items")
      .insert(prescriptionItems);

    if (itemsError) {
      return NextResponse.json(
        { error: "Failed to create prescription items" },
        { status: 500 },
      );
    }

    // Update consultation status to completed
    await supabase
      .from("larinova_consultations")
      .update({ status: "completed" })
      .eq("id", consultationId);

    return NextResponse.json({
      prescriptionId: prescription.id,
      prescriptionCode: prescription.prescription_code,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
