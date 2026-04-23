// Helena AI Assistant Types

export type DocumentType =
  | "referral_letter"
  | "medical_certificate"
  | "insurance_report"
  | "fitness_to_work"
  | "disability_report"
  | "transfer_summary"
  | "prescription_letter"
  | "consultation_summary"
  | "soap_note"
  | "general";

export interface HelenaDocument {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  consultation_id: string | null;
  conversation_id: string | null;
  document_type: DocumentType;
  title: string;
  description: string | null;
  content: string;
  content_html: string | null;
  metadata: Record<string, unknown>;
  file_url: string | null;
  file_name: string | null;
  status: "draft" | "finalized" | "sent";
  sent_at: string | null;
  sent_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelenaConversation {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  title: string | null;
  context: {
    patient?: {
      id: string;
      name: string;
      date_of_birth?: string;
      gender?: string;
    };
    recent_consultation?: {
      id: string;
      date: string;
      chief_complaint?: string;
      diagnosis?: string;
    };
  };
  active_document_type: DocumentType | null;
  status: "active" | "completed";
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelenaMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  document_id: string | null;
  document?: HelenaDocument | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Document type display info
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  Building2,
  CheckCircle2,
  FilePen,
  ArrowRightLeft,
  Pill,
  BarChart3,
  Stethoscope,
  File,
} from "lucide-react";

export const DOCUMENT_TYPES: Record<
  DocumentType,
  { label: string; icon: LucideIcon; description: string }
> = {
  referral_letter: {
    label: "Referral Letter",
    icon: ClipboardList,
    description: "Refer patient to a specialist",
  },
  medical_certificate: {
    label: "Medical Certificate",
    icon: FileText,
    description: "Sick leave or fitness certificate",
  },
  insurance_report: {
    label: "Insurance Report",
    icon: Building2,
    description: "Insurance claims and reports",
  },
  fitness_to_work: {
    label: "Fitness to Work",
    icon: CheckCircle2,
    description: "Clearance to return to work",
  },
  disability_report: {
    label: "Disability Report",
    icon: FilePen,
    description: "Disability assessment documentation",
  },
  transfer_summary: {
    label: "Transfer Summary",
    icon: ArrowRightLeft,
    description: "Patient transfer documentation",
  },
  prescription_letter: {
    label: "Prescription Letter",
    icon: Pill,
    description: "Detailed prescription explanation",
  },
  consultation_summary: {
    label: "Consultation Summary",
    icon: BarChart3,
    description: "AI-generated consultation summary",
  },
  soap_note: {
    label: "SOAP Note",
    icon: Stethoscope,
    description: "Clinical SOAP documentation",
  },
  general: {
    label: "General Document",
    icon: File,
    description: "General medical documentation",
  },
};

// Document with joined patient, doctor, and consultation data
export interface DocumentWithPatient extends HelenaDocument {
  patient?: {
    id: string;
    full_name: string;
    patient_code: string;
    date_of_birth?: string;
    gender?: string;
  } | null;
  doctor?: {
    id: string;
    full_name: string;
    specialization?: string;
    license_number?: string;
  } | null;
  consultation?: {
    id: string;
    consultation_code: string;
  } | null;
}

// Chat request/response types
export interface HelenaChatRequest {
  message: string;
  conversation_id?: string;
  patient_id?: string;
  document_type?: DocumentType;
  generate_document?: boolean;
}

export interface HelenaChatResponse {
  message: string;
  conversation_id: string;
  document?: HelenaDocument;
}
