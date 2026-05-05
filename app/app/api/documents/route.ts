import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  MEDICAL_CERTIFICATE_TYPE_TITLES,
  MEDICAL_CERTIFICATE_TYPES,
  buildMedicalCertificateContent,
} from "@/lib/documents/sick-leave-certificate";

const sickLeaveSchema = z.object({
  document_type: z.literal("medical_certificate"),
  certificate_type: z.enum(MEDICAL_CERTIFICATE_TYPES),
  patient_id: z.string().uuid(),
  condition: z.string().trim().min(2).max(500),
  treatment_provided: z.string().trim().min(2).max(1000),
  leave_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  leave_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rest_advice: z.string().trim().max(1000).optional(),
  remarks: z.string().trim().max(1000).optional(),
}).refine(
  (value) =>
    new Date(`${value.leave_end_date}T00:00:00`) >=
    new Date(`${value.leave_start_date}T00:00:00`),
  { path: ["leave_end_date"] },
);

// GET - List all documents for the current doctor
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const patientId = searchParams.get("patient_id");

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor info
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from("larinova_documents")
      .select(
        `
        *,
        patient:larinova_patients(id, full_name, patient_code, date_of_birth, gender, address),
        consultation:larinova_consultations(id, consultation_code)
      `,
      )
      .eq("doctor_id", doctor.id)
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("document_type", type);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data: documents, error } = await query.limit(100);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 },
      );
    }

    // Group documents by type for folder structure
    const documentsByType: Record<string, typeof documents> = {};
    documents?.forEach((doc) => {
      const docType = doc.document_type || "general";
      if (!documentsByType[docType]) {
        documentsByType[docType] = [];
      }
      documentsByType[docType].push(doc);
    });

    return NextResponse.json({
      documents,
      documentsByType,
      total: documents?.length || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = sickLeaveSchema.parse(await req.json());
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id, full_name, specialization, license_number, clinic_address")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const { data: patient } = await supabase
      .from("larinova_patients")
      .select("id, full_name, patient_code, date_of_birth, gender, address")
      .eq("id", body.patient_id)
      .eq("created_by_doctor_id", doctor.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const issueDate = new Date().toISOString().slice(0, 10);
    const content = buildMedicalCertificateContent({
      certificateType: body.certificate_type,
      issueDate,
      patient: {
        fullName: patient.full_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        address: patient.address,
      },
      doctor: {
        fullName: doctor.full_name,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        clinicAddress: doctor.clinic_address,
      },
      form: {
        condition: body.condition,
        treatmentProvided: body.treatment_provided,
        leaveStartDate: body.leave_start_date,
        leaveEndDate: body.leave_end_date,
        restAdvice: body.rest_advice,
        remarks: body.remarks,
      },
    });

    const { data: document, error } = await supabase
      .from("larinova_documents")
      .insert({
        doctor_id: doctor.id,
        patient_id: patient.id,
        document_type: "medical_certificate",
        title: `Medical Certificate - ${MEDICAL_CERTIFICATE_TYPE_TITLES[body.certificate_type]} - ${patient.full_name}`,
        description: `Structured ${MEDICAL_CERTIFICATE_TYPE_TITLES[body.certificate_type].toLowerCase()}`,
        content,
        metadata: {
          certificate_type: body.certificate_type,
          structured_form: {
            condition: body.condition,
            treatment_provided: body.treatment_provided,
            leave_start_date: body.leave_start_date,
            leave_end_date: body.leave_end_date,
            rest_advice: body.rest_advice || null,
            remarks: body.remarks || null,
            issue_date: issueDate,
          },
        },
        status: "draft",
      })
      .select(
        `
        *,
        patient:larinova_patients(id, full_name, patient_code, date_of_birth, gender, address),
        consultation:larinova_consultations(id, consultation_code)
      `,
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid certificate details" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
