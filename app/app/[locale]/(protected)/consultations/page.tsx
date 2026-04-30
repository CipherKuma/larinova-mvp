import { createClient } from "@/lib/supabase/server";
import {
  ConsultationsClient,
  type ConsultationListItem,
} from "@/components/consultations/ConsultationsClient";

export default async function ConsultationsPage() {
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
    return <ConsultationsClient consultations={[]} />;
  }

  const { data, error } = await supabase
    .from("larinova_consultations")
    .select(
      `
      id,
      consultation_code,
      start_time,
      end_time,
      status,
      chief_complaint,
      larinova_patients (
        full_name,
        patient_code
      )
    `,
    )
    .eq("doctor_id", doctor.id)
    .order("start_time", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching consultations:", error);
  }

  const consultations = (data || []).map((consultation) => {
    const patient = Array.isArray(consultation.larinova_patients)
      ? consultation.larinova_patients[0]
      : consultation.larinova_patients;

    return {
      ...consultation,
      larinova_patients: patient ?? null,
    };
  }) as ConsultationListItem[];

  return <ConsultationsClient consultations={consultations} />;
}
