// Export the generated Supabase types
export type { Database } from "./database.types";
import type { Database } from "./database.types";

// Convenient type aliases for Larinova tables
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Larinova-specific type aliases for easier imports
export type Doctor = Tables<"larinova_doctors">;
export type DoctorInsert = Inserts<"larinova_doctors">;
export type DoctorUpdate = Updates<"larinova_doctors">;

export type Patient = Tables<"larinova_patients">;
export type PatientInsert = Inserts<"larinova_patients">;
export type PatientUpdate = Updates<"larinova_patients">;

export type Consultation = Tables<"larinova_consultations">;
export type ConsultationInsert = Inserts<"larinova_consultations">;
export type ConsultationUpdate = Updates<"larinova_consultations">;

export type Transcript = Tables<"larinova_transcripts">;
export type TranscriptInsert = Inserts<"larinova_transcripts">;
export type TranscriptUpdate = Updates<"larinova_transcripts">;

export type Medicine = Tables<"larinova_medicines">;
export type MedicineInsert = Inserts<"larinova_medicines">;
export type MedicineUpdate = Updates<"larinova_medicines">;

export type Prescription = Tables<"larinova_prescriptions">;
export type PrescriptionInsert = Inserts<"larinova_prescriptions">;
export type PrescriptionUpdate = Updates<"larinova_prescriptions">;

export type PrescriptionItem = Tables<"larinova_prescription_items">;
export type PrescriptionItemInsert = Inserts<"larinova_prescription_items">;
export type PrescriptionItemUpdate = Updates<"larinova_prescription_items">;

export type HealthRecord = Tables<"larinova_health_records">;
export type HealthRecordInsert = Inserts<"larinova_health_records">;
export type HealthRecordUpdate = Updates<"larinova_health_records">;

export type Insurance = Tables<"larinova_insurance">;
export type InsuranceInsert = Inserts<"larinova_insurance">;
export type InsuranceUpdate = Updates<"larinova_insurance">;
