"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConsultationNotesProps {
  consultationId: string;
}

export function ConsultationNotes({ consultationId }: ConsultationNotesProps) {
  const t = useTranslations("consultations");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      saveNotes();
    }, 30000); // 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, chiefComplaint, notes]);

  const saveNotes = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(
        `/api/consultations/${consultationId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chief_complaint: chiefComplaint,
            notes: notes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChiefComplaintChange = (value: string) => {
    setChiefComplaint(value.toUpperCase());
    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value.toUpperCase());
    setHasUnsavedChanges(true);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return "just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    return lastSaved.toLocaleTimeString();
  };

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-2 md:p-2.5 lg:p-3 xl:p-4 2xl:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-2.5 lg:gap-3">
          <div>
            <h2 className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-display uppercase font-bold">
              {t("notes")}
            </h2>
            <p className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm text-muted-foreground mt-0.5 uppercase">
              {t("notesSubtitle")}
            </p>
          </div>

          <Button
            onClick={saveNotes}
            disabled={isSaving || !hasUnsavedChanges}
            className="h-6 md:h-7 lg:h-8 xl:h-9 2xl:h-10 px-2 md:px-2.5 lg:px-3 xl:px-4 2xl:px-6 font-semibold uppercase bg-primary text-primary-foreground hover:bg-primary/90 text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm w-full md:w-auto"
          >
            {isSaving ? (
              <>
                <Save className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 mr-1 md:mr-1.5 lg:mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 mr-1 md:mr-1.5 lg:mr-2" />
                {t("saveNotes")}
              </>
            )}
          </Button>
        </div>

        {/* Last Saved Indicator */}
        {lastSaved && !hasUnsavedChanges && (
          <div className="mt-1.5 md:mt-2 lg:mt-2.5 flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm text-green-700 uppercase">
            <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" />
            <span>{t("savedAt", { time: formatLastSaved() ?? "" })}</span>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mt-1.5 md:mt-2 lg:mt-2.5 text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm text-orange-600 font-semibold uppercase">
            {t("unsavedChanges")}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="p-2 md:p-2.5 lg:p-3 xl:p-4 2xl:p-6 space-y-2 md:space-y-2.5 lg:space-y-3 xl:space-y-4 2xl:space-y-6">
        {/* Chief Complaint */}
        <div className="space-y-0.5 md:space-y-1">
          <Label
            htmlFor="chief-complaint"
            className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm uppercase font-semibold"
          >
            {t("chiefComplaintLabel")}
          </Label>
          <Input
            id="chief-complaint"
            value={chiefComplaint}
            onChange={(e) => handleChiefComplaintChange(e.target.value)}
            placeholder={t("chiefComplaintPlaceholder")}
            className="border border-border h-6 md:h-7 lg:h-8 xl:h-9 2xl:h-10 text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base uppercase placeholder:normal-case focus:ring-0 focus:ring-offset-0 focus:border-border"
          />
          <p className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-muted-foreground uppercase">
            {t("chiefComplaintHint")}
          </p>
        </div>

        {/* Consultation Notes */}
        <div className="space-y-0.5 md:space-y-1">
          <Label
            htmlFor="notes"
            className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm uppercase font-semibold"
          >
            {t("notes")}
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={t("notesPlaceholder")}
            className="border border-border min-h-[100px] md:min-h-[120px] lg:min-h-[150px] xl:min-h-[180px] 2xl:min-h-[200px] text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base resize-y uppercase placeholder:normal-case focus:ring-0 focus:ring-offset-0 focus:border-border"
          />
          <p className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-muted-foreground uppercase">
            {t("notesHint")}
          </p>
        </div>

        {/* Quick Notes Templates */}
        <div className="pt-1 md:pt-1.5 lg:pt-2 xl:pt-3 2xl:pt-4">
          <div className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase font-semibold text-muted-foreground mb-1 md:mb-1.5 lg:mb-2">
            {t("quickTemplates")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleNotesChange(
                  notes +
                    "\n\n**Symptoms:** \n**Duration:** \n**Severity:** \n**Associated factors:** ",
                )
              }
              className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase border-0 hover:border hover:border-border h-6 md:h-7 lg:h-8"
            >
              {t("templateSymptoms")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleNotesChange(
                  notes +
                    "\n\n**Physical Exam:** \n**Vital Signs:** \n**General Appearance:** \n**Specific Findings:** ",
                )
              }
              className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase border-0 hover:border hover:border-border h-6 md:h-7 lg:h-8"
            >
              {t("templatePhysicalExam")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleNotesChange(
                  notes +
                    "\n\n**Assessment:** \n**Diagnosis:** \n**Plan:** \n**Follow-up:** ",
                )
              }
              className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase border-0 hover:border hover:border-border h-6 md:h-7 lg:h-8"
            >
              {t("templateAssessment")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleNotesChange(
                  notes +
                    "\n\n**Patient Education:** \n**Lifestyle Recommendations:** \n**Warning Signs:** ",
                )
              }
              className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase border-0 hover:border hover:border-border h-6 md:h-7 lg:h-8"
            >
              {t("templatePatientEd")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
