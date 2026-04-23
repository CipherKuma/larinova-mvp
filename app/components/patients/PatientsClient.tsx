"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X } from "lucide-react";
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
    <div className="glass-card pb-0 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("description")}
            </p>
          </div>
          <Link
            href="/patients/new"
            className="
              inline-flex items-center gap-2
              px-4 py-2.5
              bg-primary text-primary-foreground
              rounded-xl
              text-sm font-medium shadow-sm
              hover:bg-primary/90
              transition-all duration-200
            "
          >
            <Plus className="w-4 h-4" />
            {t("newPatient")}
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchByNameOrCode")}
            className="bg-card border border-border w-full ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
          />
          <Search
            className="
            absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2
            w-5 h-5 text-muted-foreground
          "
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="
                absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2
                hover:opacity-70
                transition-opacity
              "
              aria-label="Clear search"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Patients Table */}
      <PatientTable patients={filteredPatients} />
    </div>
  );
}
