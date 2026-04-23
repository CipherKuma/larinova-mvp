"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeItem {
  code: string;
  description: string;
}

interface MedicalCodes {
  icd10: CodeItem[];
  snomed: CodeItem[];
  cpt: CodeItem[];
}

interface MedicalCodesViewProps {
  consultationId: string;
}

export function MedicalCodesView({ consultationId }: MedicalCodesViewProps) {
  const t = useTranslations("medicalCodesView");
  const [soapNote, setSoapNote] = useState<string | null>(null);
  const [medicalCodes, setMedicalCodes] = useState<MedicalCodes | null>(null);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSoap, setExpandedSoap] = useState(false);
  const [expandedSection, setExpandedSection] = useState<
    "icd10" | "snomed" | "cpt" | null
  >(null);

  const generateSoapNote = async () => {
    try {
      setIsGeneratingSoap(true);
      setError(null);

      const response = await fetch(
        `/api/consultations/${consultationId}/soap-note`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate SOAP note");
      }

      const data = await response.json();
      setSoapNote(data.soapNote);
    } catch (err: any) {
      console.error("Error generating SOAP note:", err);
      setError(err.message || "Failed to generate SOAP note");
    } finally {
      setIsGeneratingSoap(false);
    }
  };

  const generateMedicalCodes = async () => {
    try {
      setIsGeneratingCodes(true);
      setError(null);

      const response = await fetch(
        `/api/consultations/${consultationId}/medical-codes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ soapNote }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate medical codes");
      }

      const data = await response.json();
      setMedicalCodes(data.medicalCodes);
    } catch (err: any) {
      console.error("Error generating medical codes:", err);
      setError(err.message || "Failed to generate medical codes");
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const generateBoth = async () => {
    await generateSoapNote();
  };

  useEffect(() => {
    if (soapNote && !medicalCodes && !isGeneratingCodes) {
      generateMedicalCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soapNote]);

  const toggleSection = (section: "icd10" | "snomed" | "cpt") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getSectionColor = (section: "icd10" | "snomed" | "cpt") => {
    return "border-border bg-card";
  };

  const getSectionHeaderColor = (section: "icd10" | "snomed" | "cpt") => {
    return "bg-primary text-primary-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card">
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display uppercase font-bold">
                {t("clinicalDocumentation")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 uppercase">
                {t("aiGeneratedSoapCodes")}
              </p>
            </div>

            {!soapNote && !medicalCodes && (
              <Button
                onClick={generateBoth}
                disabled={isGeneratingSoap}
                className="h-12 px-6 font-semibold uppercase bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isGeneratingSoap ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    {t("generateDocumentation")}
                  </>
                )}
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-muted border border-border flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-foreground uppercase text-sm">
                  {t("error")}
                </div>
                <div className="text-sm text-foreground mt-1 uppercase">
                  {error}
                </div>
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  className="mt-3 text-xs border-border"
                >
                  {t("dismiss")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {soapNote && (
          <div className="p-6 border-b border-border">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSoap(!expandedSoap)}
            >
              <h3 className="text-xl font-display uppercase font-bold">
                {t("soapNote")}
              </h3>
              {expandedSoap ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSoap && (
              <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {soapNote}
                </pre>
              </div>
            )}

            {isGeneratingCodes && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="uppercase">{t("extractingCodes")}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {medicalCodes && (
        <div className="space-y-4">
          {medicalCodes.icd10 && medicalCodes.icd10.length > 0 && (
            <div className={cn("border", getSectionColor("icd10"))}>
              <div
                className={cn(
                  "p-4 cursor-pointer flex items-center justify-between",
                  getSectionHeaderColor("icd10"),
                )}
                onClick={() => toggleSection("icd10")}
              >
                <div>
                  <h3 className="text-lg font-display uppercase font-bold">
                    {t("icd10DiagnosisCodes")}
                  </h3>
                  <p className="text-xs mt-1 opacity-90">
                    {medicalCodes.icd10.length}{" "}
                    {medicalCodes.icd10.length !== 1
                      ? t("codesIdentified")
                      : t("codeIdentified")}
                  </p>
                </div>
                {expandedSection === "icd10" ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>

              {expandedSection === "icd10" && (
                <div className="p-6 space-y-4">
                  {medicalCodes.icd10.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-card border border-border rounded-lg"
                    >
                      <div className="font-bold text-lg mb-2 text-foreground font-mono">
                        {item.code}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {medicalCodes.snomed && medicalCodes.snomed.length > 0 && (
            <div className={cn("border", getSectionColor("snomed"))}>
              <div
                className={cn(
                  "p-4 cursor-pointer flex items-center justify-between",
                  getSectionHeaderColor("snomed"),
                )}
                onClick={() => toggleSection("snomed")}
              >
                <div>
                  <h3 className="text-lg font-display uppercase font-bold">
                    {t("snomedClinicalTerms")}
                  </h3>
                  <p className="text-xs mt-1 opacity-90">
                    {medicalCodes.snomed.length}{" "}
                    {medicalCodes.snomed.length !== 1
                      ? t("codesIdentified")
                      : t("codeIdentified")}
                  </p>
                </div>
                {expandedSection === "snomed" ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>

              {expandedSection === "snomed" && (
                <div className="p-6 space-y-4">
                  {medicalCodes.snomed.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-card border border-border rounded-lg"
                    >
                      <div className="font-bold text-lg mb-2 text-foreground font-mono">
                        {item.code}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {medicalCodes.cpt && medicalCodes.cpt.length > 0 && (
            <div className={cn("border", getSectionColor("cpt"))}>
              <div
                className={cn(
                  "p-4 cursor-pointer flex items-center justify-between",
                  getSectionHeaderColor("cpt"),
                )}
                onClick={() => toggleSection("cpt")}
              >
                <div>
                  <h3 className="text-lg font-display uppercase font-bold">
                    {t("cptProcedureCodes")}
                  </h3>
                  <p className="text-xs mt-1 opacity-90">
                    {medicalCodes.cpt.length}{" "}
                    {medicalCodes.cpt.length !== 1
                      ? t("codesIdentified")
                      : t("codeIdentified")}
                  </p>
                </div>
                {expandedSection === "cpt" ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>

              {expandedSection === "cpt" && (
                <div className="p-6 space-y-4">
                  {medicalCodes.cpt.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-card border border-border rounded-lg"
                    >
                      <div className="font-bold text-lg mb-2 text-foreground font-mono">
                        {item.code}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!soapNote && !isGeneratingSoap && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground uppercase font-semibold">
            {t("noDocYet")}
          </p>
          <p className="text-xs text-muted-foreground mt-2 uppercase">
            {t("clickGenerate")}
          </p>
        </div>
      )}
    </div>
  );
}
