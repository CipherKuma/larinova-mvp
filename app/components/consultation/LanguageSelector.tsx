"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  onConfirm: (doctorLang: "en" | "id", patientLang: "en" | "id") => void;
}

export function LanguageSelector({ onConfirm }: LanguageSelectorProps) {
  const [doctorLanguage, setDoctorLanguage] = useState<"en" | "id">("en");
  const [patientLanguage, setPatientLanguage] = useState<"en" | "id">("en");

  const handleConfirm = () => {
    onConfirm(doctorLanguage, patientLanguage);
  };

  return (
    <div className="border border-border bg-card p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5" />
        <h3 className="text-lg font-display uppercase font-bold">
          SELECT LANGUAGES
        </h3>
      </div>

      <div className="space-y-4">
        {/* Doctor Language */}
        <div>
          <label className="block text-xs uppercase text-muted-foreground mb-2 font-semibold">
            Doctor Language
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDoctorLanguage("en")}
              className={`p-3 border-2 font-semibold uppercase text-sm transition-all ${
                doctorLanguage === "en"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setDoctorLanguage("id")}
              className={`p-3 border-2 font-semibold uppercase text-sm transition-all ${
                doctorLanguage === "id"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              Bahasa Indonesia
            </button>
          </div>
        </div>

        {/* Patient Language */}
        <div>
          <label className="block text-xs uppercase text-muted-foreground mb-2 font-semibold">
            Patient Language
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPatientLanguage("en")}
              className={`p-3 border-2 font-semibold uppercase text-sm transition-all ${
                patientLanguage === "en"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPatientLanguage("id")}
              className={`p-3 border-2 font-semibold uppercase text-sm transition-all ${
                patientLanguage === "id"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              Bahasa Indonesia
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 text-xs">
          <p className="text-blue-400 uppercase">
            {doctorLanguage === patientLanguage ? (
              <>
                <strong>SAME LANGUAGE MODE:</strong> Both speaking{" "}
                {doctorLanguage === "en" ? "English" : "Bahasa Indonesia"} with{" "}
                {doctorLanguage === "en" ? "Bahasa Indonesia" : "English"}{" "}
                subtitles
              </>
            ) : (
              <>
                <strong>BILINGUAL MODE:</strong> Enhanced speaker detection
                using language as a cue
              </>
            )}
          </p>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          className="w-full h-12 text-sm uppercase font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          START CONSULTATION
        </Button>
      </div>
    </div>
  );
}
