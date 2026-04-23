"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, Mail, Loader2 } from "lucide-react";
import {
  PrescriptionData,
  generateIndianPrescriptionHTML,
} from "@/lib/prescription/indianPdfTemplate";
import { useState } from "react";
import { toast } from "sonner";

interface PrescriptionPreviewProps {
  data: PrescriptionData;
  prescriptionId?: string;
  patientEmail?: string | null;
  onBack?: () => void;
}

export default function PrescriptionPreview({
  data,
  prescriptionId,
  patientEmail,
  onBack,
}: PrescriptionPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("prescriptionPreview");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const html = generateIndianPrescriptionHTML(data);

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      const patientName = data.patient.full_name.replace(/\s+/g, "_");
      const filename = `Prescription_${patientName}_${data.date}.pdf`;

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container.firstElementChild as HTMLElement)
        .save();

      document.body.removeChild(container);
      toast.success(t("pdfDownloaded"));
    } catch {
      toast.error(t("failedToGeneratePdf"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailToPatient = async () => {
    if (!prescriptionId || !patientEmail) {
      toast.error(t("patientEmailNotAvailable"));
      return;
    }

    setIsEmailing(true);
    try {
      const response = await fetch("/api/prescriptions/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || t("failedToSendEmail"));
      }

      toast.success(t("prescriptionEmailed"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failedToSendEmail"),
      );
    } finally {
      setIsEmailing(false);
    }
  };

  const doctorDegrees = data.doctor.degrees ? `, ${data.doctor.degrees}` : "";
  const regInfo =
    data.doctor.registration_number && data.doctor.registration_council
      ? `${t("regNo")}: ${data.doctor.registration_number} (${data.doctor.registration_council})`
      : data.doctor.registration_number
        ? `${t("regNo")}: ${data.doctor.registration_number}`
        : null;

  const patientAge = data.patient.date_of_birth
    ? calculateAge(data.patient.date_of_birth, t("yrs"))
    : null;
  const genderLabel = formatGender(data.patient.gender);

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            {t("editPrescription")}
          </Button>
        )}
        <Button onClick={handleDownloadPDF} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t("downloadPdf")}
        </Button>
        {patientEmail && prescriptionId && (
          <Button
            variant="outline"
            onClick={handleEmailToPatient}
            disabled={isEmailing}
          >
            {isEmailing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {t("emailToPatient")}
          </Button>
        )}
      </div>

      {/* In-page preview */}
      <div
        ref={previewRef}
        className="bg-white border border-border rounded-lg shadow-sm overflow-hidden"
      >
        <div className="p-6 space-y-0">
          {/* Header */}
          <div className="border-b-2 border-foreground pb-4">
            <h3 className="text-xl font-bold text-foreground">
              Dr. {data.doctor.full_name}
              {doctorDegrees}
            </h3>
            {regInfo && (
              <p className="text-sm text-muted-foreground mt-0.5">{regInfo}</p>
            )}
            {data.doctor.clinic_name && (
              <p className="text-sm font-medium text-foreground mt-1.5">
                {data.doctor.clinic_name}
              </p>
            )}
            {data.doctor.clinic_address && (
              <p className="text-xs text-muted-foreground">
                {data.doctor.clinic_address}
              </p>
            )}
            {data.doctor.phone_number && (
              <p className="text-xs text-muted-foreground">
                {t("ph")}: {data.doctor.phone_number}
              </p>
            )}
          </div>

          {/* Patient Info */}
          <div className="flex flex-wrap gap-6 py-3 border-b border-border">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("patient")}
              </span>
              <p className="text-sm font-semibold text-foreground">
                {data.patient.full_name}
              </p>
            </div>
            {patientAge && (
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("age")}
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {patientAge}
                </p>
              </div>
            )}
            {genderLabel && (
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("sex")}
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {genderLabel}
                </p>
              </div>
            )}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("date")}
              </span>
              <p className="text-sm font-semibold text-foreground">
                {data.date}
              </p>
            </div>
            {data.patient.weight && (
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("weight")}
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {data.patient.weight}
                </p>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          {data.diagnosis && (
            <div className="py-3 border-b border-border">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("diagnosis")}
              </span>
              <p className="text-sm text-foreground mt-0.5">{data.diagnosis}</p>
            </div>
          )}

          {/* Rx Symbol */}
          <div className="pt-4 pb-2">
            <span className="text-3xl font-bold font-serif text-foreground">
              &#8478;
            </span>
          </div>

          {/* Medicines */}
          <div className="space-y-0">
            {data.medicines.map((med, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground w-6 shrink-0 pt-0.5">
                  {i + 1}.
                </span>
                <div>
                  <p className="font-bold text-[15px] tracking-wide text-foreground">
                    {med.name.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {med.generic_name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-block bg-muted rounded px-2 py-0.5 text-xs text-foreground">
                      {med.route || "Oral"} · {med.dosage}
                    </span>
                    <span className="inline-block bg-muted rounded px-2 py-0.5 text-xs text-foreground">
                      {med.frequency}
                    </span>
                    <span className="inline-block bg-muted rounded px-2 py-0.5 text-xs text-foreground">
                      {med.duration}
                    </span>
                    {med.quantity && (
                      <span className="inline-block bg-muted rounded px-2 py-0.5 text-xs text-foreground">
                        {t("qty")}: {med.quantity}
                      </span>
                    )}
                  </div>
                  {med.food_timing && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                      {med.food_timing}
                    </p>
                  )}
                  {med.instructions && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Allergy Warning */}
          {data.allergy_warnings && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <span className="text-sm font-bold text-red-600">
                &#9888; {t("allergyWarning")}
              </span>
              <span className="text-sm text-red-800 ml-1">
                {data.allergy_warnings}
              </span>
            </div>
          )}

          {/* Follow-up */}
          {data.follow_up_date && (
            <p className="mt-3 text-sm text-foreground">
              <span className="font-semibold">{t("followUp")}</span>{" "}
              {data.follow_up_date}
            </p>
          )}

          {/* Doctor Notes */}
          {data.doctor_notes && (
            <div className="mt-3 p-3 bg-muted/50 border-l-[3px] border-muted-foreground/30 rounded-r-md">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("notes")}
              </span>
              <p className="text-sm text-foreground mt-1">
                {data.doctor_notes}
              </p>
            </div>
          )}

          {/* Signature */}
          <div className="mt-12 pt-4 border-t border-border flex justify-end">
            <div className="text-center">
              <div className="w-48 border-b border-foreground mb-2 h-10" />
              <p className="text-sm font-semibold text-foreground">
                Dr. {data.doctor.full_name}
                {doctorDegrees}
              </p>
              {regInfo && (
                <p className="text-xs text-muted-foreground">{regInfo}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateAge(dob: string, yrsLabel: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} ${yrsLabel}`;
}

function formatGender(gender: string | null): string | null {
  if (!gender) return null;
  const map: Record<string, string> = {
    male: "M",
    female: "F",
    other: "Other",
    prefer_not_to_say: "",
  };
  return map[gender] || gender || null;
}
