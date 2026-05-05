"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MEDICAL_CERTIFICATE_TYPES,
  type MedicalCertificateType,
} from "@/lib/documents/sick-leave-certificate";
import type { DocumentWithPatient } from "@/types/helena";

interface PatientOption {
  id: string;
  patient_code?: string | null;
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
}

interface SickLeaveCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (document: DocumentWithPatient) => void;
}

const blankForm = {
  condition: "",
  treatmentProvided: "",
  leaveStartDate: "",
  leaveEndDate: "",
  restAdvice: "",
  remarks: "",
};

function formatGender(value?: string | null) {
  if (!value) return null;
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return String(Math.max(age, 0));
}

function parseFormDate(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIsoDate(date: Date | undefined) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateRangeValid(startDate: string, endDate: string) {
  const start = parseFormDate(startDate);
  const end = parseFormDate(endDate);
  return Boolean(start && end && end >= start);
}

export function SickLeaveCertificateDialog({
  open,
  onOpenChange,
  onCreated,
}: SickLeaveCertificateDialogProps) {
  const t = useTranslations("documents.sickLeaveForm");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [certificateType, setCertificateType] =
    useState<MedicalCertificateType>("sick_leave");
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPatientsLoading(true);
    fetch("/api/patients?limit=500")
      .then((response) => (response.ok ? response.json() : { patients: [] }))
      .then((data) => {
        if (!cancelled) setPatients(data.patients || []);
      })
      .catch(() => {
        if (!cancelled) setError(t("loadPatientsFailed"));
      })
      .finally(() => {
        if (!cancelled) setPatientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  const canSubmit =
    selectedPatientId &&
    form.condition.trim() &&
    form.treatmentProvided.trim() &&
    /^\d{4}-\d{2}-\d{2}$/.test(form.leaveStartDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(form.leaveEndDate) &&
    isDateRangeValid(form.leaveStartDate, form.leaveEndDate);

  const updateField = (field: keyof typeof blankForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reset = () => {
    setSelectedPatientId("");
    setCertificateType("sick_leave");
    setForm(blankForm);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit || creating) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: "medical_certificate",
          certificate_type: certificateType,
          patient_id: selectedPatientId,
          condition: form.condition,
          treatment_provided: form.treatmentProvided,
          leave_start_date: form.leaveStartDate,
          leave_end_date: form.leaveEndDate,
          rest_advice: form.restAdvice || undefined,
          remarks: form.remarks || undefined,
        }),
      });
      if (!response.ok) throw new Error("create_failed");
      const data = await response.json();
      onCreated(data.document);
      reset();
      onOpenChange(false);
    } catch {
      setError(t("createFailed"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>{t("typeLabel")}</Label>
            <Select
              value={certificateType}
              onValueChange={(value) =>
                setCertificateType(value as MedicalCertificateType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {MEDICAL_CERTIFICATE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`typeOptions.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t(`typeDescriptions.${certificateType}`)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("patientLabel")}</Label>
            <Select
              value={selectedPatientId}
              onValueChange={setSelectedPatientId}
              disabled={patientsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    patientsLoading ? t("loadingPatients") : t("patientPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                    {patient.patient_code ? ` - ${patient.patient_code}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && (
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("age")}</p>
                <p className="font-medium">
                  {calculateAge(selectedPatient.date_of_birth) || t("notRecorded")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("genderValue")}</p>
                <p className="font-medium">
                  {formatGender(selectedPatient.gender) || t("notRecorded")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("address")}</p>
                <p className="font-medium">
                  {selectedPatient.address || t("notRecorded")}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sick-leave-condition">
                {t(`fieldLabels.${certificateType}.condition`)}
              </Label>
              <Input
                id="sick-leave-condition"
                value={form.condition}
                onChange={(event) => updateField("condition", event.target.value)}
                placeholder={t(`fieldPlaceholders.${certificateType}.condition`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sick-leave-treatment">
                {t(`fieldLabels.${certificateType}.treatment`)}
              </Label>
              <Input
                id="sick-leave-treatment"
                value={form.treatmentProvided}
                onChange={(event) =>
                  updateField("treatmentProvided", event.target.value)
                }
                placeholder={t(`fieldPlaceholders.${certificateType}.treatment`)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sick-leave-start">
                {t(`fieldLabels.${certificateType}.startDate`)}
              </Label>
              <DatePicker
                date={parseFormDate(form.leaveStartDate)}
                onDateChange={(date) =>
                  updateField("leaveStartDate", toIsoDate(date))
                }
                placeholder={t(`fieldPlaceholders.${certificateType}.startDate`)}
                initialMonth={new Date()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sick-leave-end">
                {t(`fieldLabels.${certificateType}.endDate`)}
              </Label>
              <DatePicker
                date={parseFormDate(form.leaveEndDate)}
                onDateChange={(date) =>
                  updateField("leaveEndDate", toIsoDate(date))
                }
                placeholder={t(`fieldPlaceholders.${certificateType}.endDate`)}
                initialMonth={parseFormDate(form.leaveStartDate) || new Date()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sick-leave-advice">
              {t(`fieldLabels.${certificateType}.advice`)}
            </Label>
            <Textarea
              id="sick-leave-advice"
              value={form.restAdvice}
              onChange={(event) => updateField("restAdvice", event.target.value)}
              placeholder={t(`fieldPlaceholders.${certificateType}.advice`)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sick-leave-remarks">{t("remarksLabel")}</Label>
            <Textarea
              id="sick-leave-remarks"
              value={form.remarks}
              onChange={(event) => updateField("remarks", event.target.value)}
              placeholder={t("remarksPlaceholder")}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {creating ? t("creating") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
