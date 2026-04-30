import { createClient } from "@/lib/supabase/server";
import { PatientsClient } from "@/components/patients/PatientsClient";
import { redirect } from "next/navigation";

export default async function PatientsPage() {
  const supabase = await createClient();

  // Get current user and doctor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctor) {
    redirect("/sign-in");
  }

  // Fetch all patients (no server-side filtering)
  const { data: patients, error } = await supabase
    .from("larinova_patients")
    .select("id, patient_code, full_name, email, date_of_birth, blood_group")
    .eq("created_by_doctor_id", doctor.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
  }

  return <PatientsClient initialPatients={patients || []} />;
}
