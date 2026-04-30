"use client";

import { useState } from "react";
import { Link, useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowLeft, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ConsultationPatientOption {
  id: string;
  full_name: string;
  patient_code: string;
}

export function NewConsultationClient({
  patients,
}: {
  patients: ConsultationPatientOption[];
}) {
  const router = useRouter();
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center gap-2 -ml-2 min-h-[40px]"
          >
            <Link href="/consultations">
              <ArrowLeft className="w-4 h-4" />
              {t("consultations.title")}
            </Link>
          </Button>
        </div>
        <div className="mt-3 md:mt-4">
          <h1 className="text-lg md:text-2xl font-bold text-foreground">
            {t("consultations.newConsultation")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {t("consultations.choosePatientType")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="glass-card p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {t("consultations.existingPatient")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("consultations.existingPatientDesc")}
              </p>
            </div>
          </div>

          <Input
            placeholder={t("consultations.searchPatientPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[44px] text-base md:text-sm"
          />

          <div className="flex-1 min-h-[200px] max-h-[320px] overflow-y-auto space-y-1">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() =>
                    router.push(`/patients/${patient.id}/consultation` as any)
                  }
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {patient.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {patient.patient_code}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? t("consultations.noPatientFound")
                  : t("consultations.noPatientsYet")}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-green-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {t("consultations.newPatientOption")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("consultations.newPatientDesc")}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3 py-8">
            <p className="text-sm text-muted-foreground text-center">
              {t("consultations.newPatientHint")}
            </p>
          </div>

          <Button className="w-full min-h-[44px]" asChild>
            <Link href="/consultations/new/record">
              <UserPlus className="w-4 h-4 mr-2" />
              {t("consultations.startWithNewPatient")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
