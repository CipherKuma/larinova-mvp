"use client";

import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Link } from "@/src/i18n/routing";
import { PatientTable } from "./PatientTable";
import { useTranslations } from "next-intl";

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  blood_group: string;
}

interface PatientsClientProps {
  initialPatients: Patient[];
}

export function PatientsClient({ initialPatients }: PatientsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("patients");

  // Filter patients on the client side
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialPatients;
    }

    const query = searchQuery.toLowerCase().trim();
    return initialPatients.filter(
      (patient) =>
        patient.full_name.toLowerCase().includes(query) ||
        patient.patient_code.toLowerCase().includes(query),
    );
  }, [initialPatients, searchQuery]);

  return (
    <div className="md:glass-card md:pb-0 md:overflow-hidden">
      {/* Header */}
      <div className="px-1 md:px-6 pt-1 md:pt-6 pb-4 md:pb-6 md:border-b md:border-border">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <p className="hidden md:block text-muted-foreground text-sm mt-1">
              {t("description")}
            </p>
          </div>
          {/* Desktop: inline action */}
          <Link
            href="/patients/new"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:bg-primary/90 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            {t("newPatient")}
          </Link>
        </div>

        {/* Search input — no inline icon, placeholder is the affordance */}
        <div className="relative mt-3 md:mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchByNameOrCode")}
            className="bg-card border border-border w-full ltr:pr-10 rtl:pl-10 px-4 py-3 min-h-[48px] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-base md:text-sm transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute ltr:right-1 rtl:left-1 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center text-muted-foreground active:bg-muted/40 rounded-full"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <PatientTable patients={filteredPatients} />

      {/* Mobile FAB — Add patient */}
      <Link
        href="/patients/new"
        aria-label={t("newPatient")}
        className="md:hidden fixed z-40 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom))",
        }}
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
