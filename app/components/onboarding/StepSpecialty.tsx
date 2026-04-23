"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Stethoscope,
  Baby,
  Heart,
  Sparkles,
  Users,
  Bone,
  Ear,
  Eye,
  Wind,
  Scissors,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { OnboardingCard } from "./OnboardingCard";
import { useTranslations } from "next-intl";

interface SpecialtyEntry {
  label: string;
  value: string;
  icon: LucideIcon;
}

const allSpecialties = [
  "General Practitioner",
  "Pediatrician",
  "Cardiologist",
  "Dermatologist",
  "Gynecologist / Obstetrician",
  "Orthopedist",
  "ENT Specialist",
  "Ophthalmologist",
  "Pulmonologist",
  "General Surgeon",
  "Neurologist",
  "Nephrologist",
  "Urologist",
  "Gastroenterologist",
  "Psychiatrist",
  "Oncologist",
  "Endocrinologist",
  "Rheumatologist",
  "Anesthesiologist",
  "Radiologist",
  "Pathologist",
  "Hematologist",
  "Neonatologist",
  "Geriatrician",
  "Intensivist",
  "Plastic Surgeon",
  "Cardiothoracic Surgeon",
  "Neurosurgeon",
  "Vascular Surgeon",
  "Pediatric Surgeon",
  "Surgical Oncologist",
  "Hepatologist",
  "Diabetologist",
  "Allergist / Immunologist",
  "Infectious Disease Specialist",
  "Sports Medicine Specialist",
  "Pain Management Specialist",
  "Palliative Care Specialist",
  "Emergency Medicine",
  "Family Medicine",
  "Preventive Medicine",
  "Nuclear Medicine",
  "Physical Medicine & Rehabilitation",
  "Forensic Medicine",
  "Community Medicine",
  "Ayurveda",
  "Homeopathy",
  "Unani Medicine",
  "Siddha Medicine",
  "Dentist",
];

const popularValues = [
  "General Practitioner",
  "Pediatrician",
  "Cardiologist",
  "Dermatologist",
  "Gynecologist / Obstetrician",
  "Orthopedist",
  "ENT Specialist",
  "Ophthalmologist",
  "Pulmonologist",
  "General Surgeon",
];

interface StepSpecialtyProps {
  onContinue: (specialty: string) => void;
  onBack: () => void;
}

export function StepSpecialty({ onContinue, onBack }: StepSpecialtyProps) {
  const t = useTranslations("onboarding.specialtyStep");
  const tc = useTranslations("common");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  );
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const popularSpecialties: SpecialtyEntry[] = [
    {
      label: t("popularGeneral"),
      value: "General Practitioner",
      icon: Stethoscope,
    },
    { label: t("popularPediatrics"), value: "Pediatrician", icon: Baby },
    { label: t("popularCardiology"), value: "Cardiologist", icon: Heart },
    { label: t("popularDermatology"), value: "Dermatologist", icon: Sparkles },
    {
      label: t("popularGynecology"),
      value: "Gynecologist / Obstetrician",
      icon: Users,
    },
    { label: t("popularOrthopedics"), value: "Orthopedist", icon: Bone },
    { label: t("popularENT"), value: "ENT Specialist", icon: Ear },
    { label: t("popularOphthalmology"), value: "Ophthalmologist", icon: Eye },
    { label: t("popularPulmonology"), value: "Pulmonologist", icon: Wind },
    { label: t("popularSurgery"), value: "General Surgeon", icon: Scissors },
  ];

  const otherSpecialties = allSpecialties.filter(
    (s) => !popularValues.includes(s),
  );

  const filteredOther = searchQuery
    ? otherSpecialties.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : otherSpecialties;

  const handleSelect = (value: string) => {
    setSelectedSpecialty(value);
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — pinned */}
      <div className="flex-shrink-0 pt-4 pb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("title")}
        </h2>
        <p className="font-display text-foreground/50 tracking-wide">
          {t("subtitle")}
        </p>
      </div>

      {/* Content — fills available space, scrollable if overflow */}
      <div
        className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-fr">
          {popularSpecialties.map((specialty, i) => {
            const Icon = specialty.icon;
            return (
              <OnboardingCard
                key={specialty.value}
                selected={selectedSpecialty === specialty.value}
                onClick={() => handleSelect(specialty.value)}
                index={i}
                className="text-center h-full"
              >
                <div className="flex flex-col items-center justify-center gap-3 h-full">
                  <Icon className="w-7 h-7 text-primary" />
                  <p className="text-sm text-foreground">{specialty.label}</p>
                </div>
              </OnboardingCard>
            );
          })}
        </div>

        {/* "Don't see yours?" expander */}
        <div className="mt-4">
          {selectedSpecialty && !popularValues.includes(selectedSpecialty) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between"
            >
              <span className="text-sm text-foreground">
                {selectedSpecialty}
              </span>
              <button
                onClick={() => {
                  setSelectedSpecialty(null);
                  setShowSearch(true);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("change")}
              </button>
            </motion.div>
          )}

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("dontSeeYours")}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showSearch ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-2"
                    autoFocus
                  />
                  <div className="max-h-[180px] overflow-y-auto space-y-0.5 rounded-lg border border-border/30 bg-muted/10 p-1">
                    {filteredOther.length > 0 ? (
                      filteredOther.map((specialty) => (
                        <button
                          key={specialty}
                          onClick={() => handleSelect(specialty)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedSpecialty === specialty
                              ? "bg-primary/15 text-primary"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {specialty}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        {t("noMatches")}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions — pinned bottom */}
      <div className="flex-shrink-0 flex justify-between items-center pt-6 pb-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          {tc("back")}
        </Button>
        <Button
          onClick={() => selectedSpecialty && onContinue(selectedSpecialty)}
          disabled={!selectedSpecialty}
          size="lg"
        >
          {tc("continue")}
        </Button>
      </div>
    </div>
  );
}
