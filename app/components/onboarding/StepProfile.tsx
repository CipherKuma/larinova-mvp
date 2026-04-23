"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
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
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { OnboardingCard } from "./OnboardingCard";

const specialtyIcons: Record<string, LucideIcon> = {
  "General Practitioner": Stethoscope,
  Pediatrician: Baby,
  Cardiologist: Heart,
  Dermatologist: Sparkles,
  "Gynecologist / Obstetrician": Users,
  Orthopedist: Bone,
  "ENT Specialist": Ear,
  Ophthalmologist: Eye,
  Pulmonologist: Wind,
  "General Surgeon": Scissors,
};

const popularSpecialties = [
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

const allSpecialties = [
  ...popularSpecialties,
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

const registrationCouncils = [
  "Medical Council of India (MCI)",
  "Tamil Nadu Medical Council",
  "Karnataka Medical Council",
  "Andhra Pradesh Medical Council",
  "Kerala Medical Council",
  "Maharashtra Medical Council",
  "Other State Medical Council",
];

const councilPrefixes: Record<string, string> = {
  TN: "Tamil Nadu Medical Council",
  KA: "Karnataka Medical Council",
  AP: "Andhra Pradesh Medical Council",
  KL: "Kerala Medical Council",
  MH: "Maharashtra Medical Council",
  MCI: "Medical Council of India (MCI)",
};

interface StepProfileProps {
  onContinue: (data: {
    specialty: string;
    degrees?: string;
    registrationNumber?: string;
    registrationCouncil?: string;
  }) => void;
  onBack: () => void;
}

export function StepProfile({ onContinue, onBack }: StepProfileProps) {
  const t = useTranslations("onboarding");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  );
  const [showOtherSearch, setShowOtherSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [degrees, setDegrees] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationCouncil, setRegistrationCouncil] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationNumber) return;
    const upper = registrationNumber.toUpperCase();
    for (const [prefix, council] of Object.entries(councilPrefixes)) {
      if (upper.startsWith(prefix + "/") || upper === prefix) {
        setRegistrationCouncil(council);
        return;
      }
    }
  }, [registrationNumber]);

  const filteredSpecialties = searchQuery
    ? allSpecialties.filter(
        (s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !popularSpecialties.includes(s),
      )
    : allSpecialties.filter((s) => !popularSpecialties.includes(s));

  const handleSelectSpecialty = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setShowOtherSearch(false);
    setSearchQuery("");
  };

  const handleOtherClick = () => {
    if (showOtherSearch) {
      setShowOtherSearch(false);
      setSearchQuery("");
    } else {
      setShowOtherSearch(true);
      setSelectedSpecialty(null);
    }
  };

  const handleNMCLookup = async () => {
    if (!registrationNumber) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const council = registrationCouncil || "";
      const res = await fetch(
        `/api/nmc/lookup?regNo=${encodeURIComponent(registrationNumber)}&council=${encodeURIComponent(council)}`,
      );
      const data = await res.json();

      if (data.found && data.doctor) {
        // Auto-fill fields from NMC data
        if (data.doctor.degree) setDegrees(data.doctor.degree);
        if (data.doctor.council) setRegistrationCouncil(data.doctor.council);
        setLookupResult(
          `Found: ${data.doctor.name} — ${data.doctor.degree || ""}  (${data.doctor.council})`,
        );
      } else if (data.found && data.doctors?.length > 0) {
        setLookupResult(
          `${data.doctors.length} doctors found with this number. Select your council to narrow down.`,
        );
      } else {
        setLookupResult("No doctor found with this registration number.");
      }
    } catch {
      setLookupResult("Lookup failed. You can fill in details manually.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedSpecialty) return;
    onContinue({
      specialty: selectedSpecialty,
      degrees: degrees || undefined,
      registrationNumber: registrationNumber || undefined,
      registrationCouncil: registrationCouncil || undefined,
    });
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What&apos;s your specialty?
        </h2>
        <p className="text-muted-foreground mb-6">
          This helps us tailor your experience
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {popularSpecialties.map((specialty, i) => {
          const Icon = specialtyIcons[specialty];
          return (
            <OnboardingCard
              key={specialty}
              selected={selectedSpecialty === specialty}
              onClick={() => handleSelectSpecialty(specialty)}
              index={i}
              className="text-center"
            >
              <div className="flex flex-col items-center gap-2">
                {Icon && <Icon className="w-6 h-6 text-primary" />}
                <p className="text-sm text-foreground">{specialty}</p>
              </div>
            </OnboardingCard>
          );
        })}
        <OnboardingCard
          selected={showOtherSearch}
          onClick={handleOtherClick}
          index={10}
          className="text-center"
        >
          <div className="flex flex-col items-center gap-2">
            <Search className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-foreground">Other</p>
          </div>
        </OnboardingCard>
      </div>

      <AnimatePresence>
        {showOtherSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-4"
          >
            <Input
              placeholder={t("specialtyStep.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
              autoFocus
            />
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {filteredSpecialties.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => handleSelectSpecialty(specialty)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  {specialty}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSpecialty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Complete your profile
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your NMC registration number to auto-fill your details
              </p>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="text-sm font-medium mb-1.5 block text-foreground">
                    Registration Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 12345 or TN/12345"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNMCLookup()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNMCLookup}
                      disabled={!registrationNumber || lookupLoading}
                      className="flex-shrink-0 h-10 px-4"
                    >
                      {lookupLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    We&apos;ll fetch your details from the Indian Medical
                    Register
                  </p>
                </motion.div>

                {/* Lookup result — show fetched details as read-only */}
                <AnimatePresence>
                  {lookupResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {lookupResult.startsWith("Found") ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-xs font-medium text-primary uppercase tracking-wider">
                              Verified from NMC
                            </span>
                          </div>
                          {degrees && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Degrees
                              </span>
                              <span className="text-foreground font-medium">
                                {degrees}
                              </span>
                            </div>
                          )}
                          {registrationCouncil && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Council
                              </span>
                              <span className="text-foreground font-medium">
                                {registrationCouncil}
                              </span>
                            </div>
                          )}
                          {registrationNumber && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Reg. No.
                              </span>
                              <span className="text-foreground font-medium">
                                {registrationNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {lookupResult}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mt-8">
        <Button onClick={onBack} variant="ghost" size="sm">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedSpecialty}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
