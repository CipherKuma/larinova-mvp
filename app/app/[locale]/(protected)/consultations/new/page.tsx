"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowLeft, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface Patient {
  id: string;
  full_name: string;
  patient_code: string;
}

export default function NewConsultationPage() {
  const router = useRouter();
  const t = useTranslations();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("larinova_patients")
        .select("id, full_name, patient_code")
        .order("full_name");

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setPatientsLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
      {/* Header */}
      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/consultations" as any)}
            className="flex items-center gap-2 -ml-2 min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("consultations.title")}
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
        {/* Existing Patient */}
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

          <div className="relative">
            <Input
              placeholder={t("consultations.searchPatientPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[44px] text-base md:text-sm"
            />
          </div>

          <div className="flex-1 min-h-[200px] max-h-[320px] overflow-y-auto space-y-1">
            {patientsLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : filteredPatients.length > 0 ? (
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

        {/* New Patient */}
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

          <Button
            className="w-full min-h-[44px]"
            onClick={() => router.push("/consultations/new/record" as any)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t("consultations.startWithNewPatient")}
          </Button>
        </div>
      </div>
    </div>
  );
}
