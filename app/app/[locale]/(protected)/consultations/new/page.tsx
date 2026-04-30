import { createClient } from "@/lib/supabase/server";
import {
  NewConsultationClient,
  type ConsultationPatientOption,
} from "@/components/consultations/NewConsultationClient";

export default async function NewConsultationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: doctor } = user
    ? await supabase
        .from("larinova_doctors")
        .select("id")
        .eq("user_id", user.id)
        .single()
    : { data: null };

  if (!doctor) {
    return <NewConsultationClient patients={[]} />;
  }

  const { data, error } = await supabase
    .from("larinova_patients")
    .select("id, full_name, patient_code")
    .eq("created_by_doctor_id", doctor.id)
    .order("full_name");

  if (error) {
    console.error("Error fetching patients:", error);
  }

  return (
    <NewConsultationClient
      patients={(data || []) as ConsultationPatientOption[]}
    />
  );
}
