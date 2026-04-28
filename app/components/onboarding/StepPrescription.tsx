"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface Medicine {
  name: string;
  frequency: string;
  duration: string;
  timing: string;
}

interface PrescriptionData {
  patient_name: string;
  patient_sex: string;
  patient_age: string;
  medicines: Medicine[];
}

interface StepPrescriptionProps {
  doctorName: string;
  degrees?: string;
  clinicName?: string;
  registrationNumber?: string;
  registrationCouncil?: string;
  soapTranscript?: string;
  soapNote?: Record<string, string> | null;
  onDoctorDetailsChange?: (data: {
    degrees?: string;
    clinicName?: string;
  }) => void;
  onContinue: () => void;
  onBack: () => void;
}

// Inline-editable text field — click to edit, blur/enter to save
function EditableField({
  value,
  onChange,
  className = "",
  inputClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
}) {
  const t = useTranslations("onboarding.prescriptionStep");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft.trim()) onChange(draft.trim());
          else setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (draft.trim()) onChange(draft.trim());
            else setDraft(value);
          }
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        className={`bg-transparent border-b border-primary/50 outline-none text-foreground ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer border-b border-dashed border-muted-foreground/30 hover:border-primary/50 hover:text-primary transition-colors ${className}`}
      title={t("editHint")}
    >
      {value}
    </span>
  );
}

export function StepPrescription({
  doctorName,
  degrees,
  clinicName,
  registrationNumber,
  registrationCouncil,
  soapTranscript,
  soapNote,
  onDoctorDetailsChange,
  onContinue,
  onBack,
}: StepPrescriptionProps) {
  const t = useTranslations("onboarding.prescriptionStep");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(
    null,
  );
  const [editableDegrees, setEditableDegrees] = useState(degrees || "");
  const [editableClinicName, setEditableClinicName] = useState(
    clinicName || "",
  );

  useEffect(() => {
    setEditableDegrees(degrees || "");
  }, [degrees]);

  useEffect(() => {
    setEditableClinicName(clinicName || "");
  }, [clinicName]);

  const fallback: PrescriptionData = {
    patient_name: locale === "id" ? "Siti Rahayu" : "Ravi Kumar",
    patient_sex: locale === "id" ? "F" : "M",
    patient_age: "45",
    medicines:
      locale === "id"
        ? [
            {
              name: "PARACETAMOL 500MG",
              frequency: "3x1",
              duration: "5 hari",
              timing: "Sesudah makan",
            },
            {
              name: "AMOXICILLIN 500MG",
              frequency: "3x1",
              duration: "7 hari",
              timing: "Sesudah makan",
            },
          ]
        : [
            {
              name: "PARACETAMOL 500MG",
              frequency: "1-0-1",
              duration: "5 days",
              timing: "After food",
            },
            {
              name: "AMOXICILLIN 250MG",
              frequency: "1-1-1",
              duration: "7 days",
              timing: "After food",
            },
          ],
  };

  useEffect(() => {
    if (!soapNote && !soapTranscript) {
      setPrescription(fallback);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function generate() {
      try {
        const res = await fetch("/api/consultation/prescription-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            soapNote,
            transcript: soapTranscript,
            locale,
          }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        if (!cancelled && data.prescription) {
          const p = data.prescription as PrescriptionData;
          if (p.medicines && p.medicines.length > 0) {
            setPrescription(p);
          } else {
            setPrescription(fallback);
          }
        }
      } catch {
        if (!cancelled) setPrescription(fallback);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rx = prescription || fallback;
  const degreeText = editableDegrees || t("yourDegrees");
  const clinicText = editableClinicName || t("yourClinic");

  const updateDoctorDetails = (next: {
    degrees?: string;
    clinicName?: string;
  }) => {
    const merged = {
      degrees: next.degrees ?? editableDegrees,
      clinicName: next.clinicName ?? editableClinicName,
    };
    setEditableDegrees(merged.degrees);
    setEditableClinicName(merged.clinicName);
    onDoctorDetailsChange?.({
      degrees: merged.degrees.trim() || undefined,
      clinicName: merged.clinicName.trim() || undefined,
    });
  };

  // Updater helpers
  const updateField = (key: keyof PrescriptionData, value: string) => {
    setPrescription((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateMedicine = (
    index: number,
    key: keyof Medicine,
    value: string,
  ) => {
    setPrescription((prev) => {
      if (!prev) return prev;
      const meds = [...prev.medicines];
      meds[index] = { ...meds[index], [key]: value };
      return { ...prev, medicines: meds };
    });
  };

  const handlePrintPDF = async () => {
    setIsPrinting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const regNum = registrationNumber || t("yourRegNumber");
      const council = registrationCouncil || t("yourCouncil");

      const medsHtml = rx.medicines
        .map(
          (med, i) => `
          <div style="margin-bottom: 12px;">
            <p style="font-weight: 600; margin: 0;">${i + 1}. ${med.name}</p>
            <p style="color: #888; font-size: 12px; margin: 2px 0 0;">${med.frequency} · ${med.duration} · ${med.timing}</p>
          </div>`,
        )
        .join("");

      const html = `
        <div style="font-family: 'Times New Roman', serif; padding: 32px; max-width: 700px; margin: 0 auto; color: #000;">
          <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
            <p style="font-size: 18px; font-weight: bold; margin: 0;">Dr. ${doctorName}, ${degreeText}</p>
            <p style="font-size: 13px; color: #555; margin: 4px 0 0;">Reg No: ${regNum} (${council})</p>
            <p style="font-size: 13px; font-style: italic; color: #999; margin: 4px 0 0;">${clinicText}</p>
          </div>
          <div style="display: flex; gap: 24px; font-size: 13px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ddd;">
            <div><span style="color: #888;">${t("labelName")}</span><p style="margin: 2px 0; font-weight: 500;">${rx.patient_name}</p></div>
            <div><span style="color: #888;">${t("labelSex")}</span><p style="margin: 2px 0; font-weight: 500;">${rx.patient_sex}</p></div>
            <div><span style="color: #888;">${t("labelAge")}</span><p style="margin: 2px 0; font-weight: 500;">${rx.patient_age}</p></div>
          </div>
          <p style="font-size: 28px; font-weight: bold; margin: 0 0 12px;">&#8478;</p>
          <div style="margin-bottom: 24px;">${medsHtml}</div>
          <div style="border-top: 1px solid #ddd; padding-top: 16px; text-align: right;">
            <div style="width: 128px; border-bottom: 1px solid #000; margin-left: auto; margin-bottom: 4px; height: 32px;"></div>
            <p style="font-size: 13px; font-weight: 500; margin: 0;">Dr. ${doctorName}</p>
          </div>
        </div>
      `;

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename: `Sample_Prescription_Dr_${doctorName.replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: {
            unit: "mm" as const,
            format: "a4" as const,
            orientation: "portrait" as const,
          },
        })
        .from(container.firstElementChild as HTMLElement)
        .save();

      document.body.removeChild(container);
    } catch {
      // silent fail for onboarding sample
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — pinned */}
      <div className="flex-shrink-0 pt-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("title")}
          </h2>
          <p className="font-display text-foreground/50 tracking-wide">
            {t("subtitle")}
          </p>
        </motion.div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("generatingPrescription")}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
              duration: 0.5,
            }}
            className="rounded-xl border border-border bg-card p-6 shadow-lg shadow-primary/5"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Doctor Header */}
              <div className="border-b-2 border-foreground pb-3 mb-4">
                <p className="text-lg font-bold text-foreground">
                  Dr. {doctorName},{" "}
                  <EditableField
                    value={degreeText}
                    onChange={(v) => updateDoctorDetails({ degrees: v })}
                    inputClassName="min-w-28"
                  />
                </p>
                <p className="text-sm text-muted-foreground">
                  Reg No:{" "}
                  {registrationNumber ? (
                    <span className="text-foreground">
                      {registrationNumber}
                    </span>
                  ) : (
                    <span className="italic">{t("yourRegNumber")}</span>
                  )}{" "}
                  (
                  {registrationCouncil ? (
                    <span className="text-foreground">
                      {registrationCouncil}
                    </span>
                  ) : (
                    <span className="italic">{t("yourCouncil")}</span>
                  )}
                  )
                </p>
                <p className="text-sm italic text-muted-foreground/60">
                  <EditableField
                    value={clinicText}
                    onChange={(v) => updateDoctorDetails({ clinicName: v })}
                    inputClassName="min-w-40"
                  />
                </p>
              </div>

              {/* Patient Info — editable */}
              <div className="grid grid-cols-3 gap-3 text-sm mb-4 pb-3 border-b border-border">
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("labelName")}
                  </span>
                  <p className="font-medium text-foreground">
                    <EditableField
                      value={rx.patient_name}
                      onChange={(v) => updateField("patient_name", v)}
                    />
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("labelSex")}
                  </span>
                  <p className="font-medium text-foreground">
                    <EditableField
                      value={rx.patient_sex}
                      onChange={(v) => updateField("patient_sex", v)}
                    />
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("labelAge")}
                  </span>
                  <p className="font-medium text-foreground">
                    <EditableField
                      value={rx.patient_age}
                      onChange={(v) => updateField("patient_age", v)}
                    />
                  </p>
                </div>
              </div>

              {/* Rx Symbol */}
              <p className="text-2xl font-serif font-bold text-foreground mb-3">
                &#8478;
              </p>

              {/* Medicines — editable */}
              <div className="space-y-3 mb-6">
                {rx.medicines.map((med, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-semibold text-foreground">
                      {i + 1}.{" "}
                      <EditableField
                        value={med.name}
                        onChange={(v) => updateMedicine(i, "name", v)}
                      />
                    </p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <EditableField
                        value={med.frequency}
                        onChange={(v) => updateMedicine(i, "frequency", v)}
                        className="text-xs"
                        inputClassName="text-xs w-12"
                      />
                      <span>&middot;</span>
                      <EditableField
                        value={med.duration}
                        onChange={(v) => updateMedicine(i, "duration", v)}
                        className="text-xs"
                        inputClassName="text-xs w-16"
                      />
                      <span>&middot;</span>
                      <EditableField
                        value={med.timing}
                        onChange={(v) => updateMedicine(i, "timing", v)}
                        className="text-xs"
                        inputClassName="text-xs w-24"
                      />
                    </p>
                  </div>
                ))}
              </div>

              {/* Signature */}
              <div className="border-t border-border pt-4 text-right">
                <div className="w-32 border-b border-foreground mb-1 ml-auto" />
                <p className="text-sm font-medium text-foreground">
                  Dr. {doctorName}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Editable hint */}
      {!isLoading && (
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
          {t("editHint")}
        </p>
      )}

      {/* Actions — pinned bottom */}
      <div className="flex-shrink-0 flex justify-between items-center pt-4 pb-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          {tc("back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrintPDF}
            variant="outline"
            size="sm"
            disabled={isPrinting || isLoading}
          >
            {isPrinting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("printPdf")}
          </Button>
          <Button onClick={onContinue} size="lg" disabled={isLoading}>
            {tc("continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
