import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrescriptionForm from "@/components/consultation/PrescriptionForm";
import { MedicalCodesView } from "@/components/consultation/MedicalCodesView";
import { getTranslations } from "next-intl/server";

export default async function PrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: consultation, error } = await supabase
    .from("larinova_consultations")
    .select(
      `
      *,
      patient:larinova_patients(id, full_name, date_of_birth, gender, email, phone),
      doctor:larinova_doctors(id, full_name, specialization, degrees, registration_number, registration_council, clinic_name, clinic_address, phone)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !consultation) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3 md:space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-semibold text-foreground mb-1 md:mb-2">
          {t("documents.createPrescription")}
        </h1>
        <p className="text-xs md:text-base text-muted-foreground">
          {t("documents.consultationLabel")}: {consultation.consultation_code}
        </p>
      </div>

      {/* Consultation Summary Card */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-base md:text-xl font-semibold text-foreground mb-3 md:mb-4">
          {t("documents.consultationSummary")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("consultations.patient")}
            </p>
            <p className="font-medium text-foreground">
              {consultation.patient.full_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("consultations.doctor")}
            </p>
            <p className="font-medium text-foreground">
              {consultation.doctor.full_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("documents.chiefComplaint")}
            </p>
            <p className="font-medium text-foreground">
              {consultation.chief_complaint}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("documents.diagnosis")}
            </p>
            <p className="font-medium text-foreground">
              {consultation.diagnosis || t("documents.na")}
            </p>
          </div>
        </div>
      </div>

      {/* Medical Codes and SOAP Note */}
      <MedicalCodesView consultationId={consultation.id} />

      {/* Prescription Form */}
      <PrescriptionForm
        consultationId={consultation.id}
        patientId={consultation.patient_id}
        doctorId={consultation.doctor_id}
        initialDiagnosis={consultation.diagnosis || ""}
        doctor={{
          full_name: consultation.doctor.full_name,
          degrees: consultation.doctor.degrees ?? null,
          registration_number: consultation.doctor.registration_number ?? null,
          registration_council:
            consultation.doctor.registration_council ?? null,
          clinic_name: consultation.doctor.clinic_name ?? null,
          clinic_address: consultation.doctor.clinic_address ?? null,
          phone: consultation.doctor.phone ?? null,
        }}
        patient={{
          full_name: consultation.patient.full_name,
          date_of_birth: consultation.patient.date_of_birth ?? null,
          gender: consultation.patient.gender ?? null,
          email: consultation.patient.email ?? null,
          phone: consultation.patient.phone ?? null,
        }}
      />
    </div>
  );
}
