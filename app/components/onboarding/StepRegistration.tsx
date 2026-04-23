"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface NMCDoctor {
  doctorId: string;
  name: string;
  fatherName: string | null;
  registrationNo: string;
  council: string;
  yearOfInfo: number;
  degree?: string | null;
  university?: string | null;
}

interface KKIResult {
  registrationNumber: string;
  verified: "pending" | "verified" | "failed";
}

interface StepRegistrationProps {
  onContinue: (data: {
    degrees?: string;
    registrationNumber?: string;
    registrationCouncil?: string;
  }) => void;
  onBack: () => void;
}

export function StepRegistration({
  onContinue,
  onBack,
}: StepRegistrationProps) {
  const locale = useLocale();
  const t = useTranslations("onboarding.step5");
  const tc = useTranslations("common");

  const [regNumber, setRegNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<NMCDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<NMCDoctor | null>(null);
  const [kkiResult, setKkiResult] = useState<KKIResult | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const isIndonesia = locale === "id";

  const handleLookup = async () => {
    if (!regNumber.trim()) return;
    setLoading(true);
    setDoctors([]);
    setSelectedDoctor(null);
    setKkiResult(null);
    setSearchDone(false);

    try {
      if (isIndonesia) {
        // KKI — manual entry stub
        const res = await fetch("/api/kki/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationNumber: regNumber.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setKkiResult(data);
        }
      } else {
        // NMC — India
        const res = await fetch(
          `/api/nmc/lookup?regNo=${encodeURIComponent(regNumber.trim())}&council=`,
        );
        const data = await res.json();

        if (data.found && data.doctor) {
          setSelectedDoctor(data.doctor);
          setDoctors(data.doctors || []);
        } else if (data.found && data.doctors?.length > 0) {
          setDoctors(data.doctors);
        }
      }

      setSearchDone(true);
    } catch {
      setSearchDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctor: NMCDoctor) => {
    setDetailLoading(true);
    try {
      const res = await fetch("/api/nmc/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.doctorId,
          regNo: doctor.registrationNo,
        }),
      });
      const data = await res.json();

      if (data.found && data.doctor) {
        setSelectedDoctor(data.doctor);
      } else {
        setSelectedDoctor(doctor);
      }
    } catch {
      setSelectedDoctor(doctor);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleContinue = () => {
    if (isIndonesia && kkiResult) {
      onContinue({
        registrationNumber: kkiResult.registrationNumber,
      });
    } else if (selectedDoctor) {
      onContinue({
        degrees: selectedDoctor.degree || undefined,
        registrationNumber: selectedDoctor.registrationNo || regNumber,
        registrationCouncil: selectedDoctor.council || undefined,
      });
    } else {
      onContinue({
        registrationNumber: regNumber || undefined,
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — pinned */}
      <div className="flex-shrink-0 pt-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-foreground">{t("title")}</h2>
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
              {t("optional")}
            </span>
          </div>
          <p className="font-display text-foreground/50 tracking-wide">
            {t("description")}
          </p>
        </motion.div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Registration number input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-sm font-medium mb-1.5 block text-foreground">
            {isIndonesia ? t("kkiLabel") : t("nmcLabel")}
          </label>
          <div className="flex gap-2">
            <Input
              placeholder={
                isIndonesia ? t("kkiPlaceholder") : t("nmcPlaceholder")
              }
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              autoFocus
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleLookup}
              disabled={!regNumber.trim() || loading}
              className="flex-shrink-0 h-10 px-5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-1.5" />
                  {t("verifyBtn")}
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-1.5">
            {isIndonesia ? t("kkiHint") : t("nmcHint")}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* KKI — pending verification card */}
          {isIndonesia && kkiResult && (
            <motion.div
              key="kki-pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                    {t("verificationPending")}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("kkiLabel")}
                    </span>
                    <span className="text-foreground font-medium">
                      {kkiResult.registrationNumber}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setKkiResult(null);
                    setSearchDone(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
                >
                  {t("searchAgain")}
                </button>
              </div>
            </motion.div>
          )}

          {/* NMC — selected doctor verified card */}
          {!isIndonesia && selectedDoctor && (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    {t("verifiedSource")}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("colName")}
                    </span>
                    <span className="text-foreground font-medium">
                      {selectedDoctor.name}
                    </span>
                  </div>
                  {selectedDoctor.degree && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("colDegrees")}
                      </span>
                      <span className="text-foreground font-medium">
                        {selectedDoctor.degree}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("colCouncil")}
                    </span>
                    <span className="text-foreground font-medium">
                      {selectedDoctor.council}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("colRegNo")}
                    </span>
                    <span className="text-foreground font-medium">
                      {selectedDoctor.registrationNo}
                    </span>
                  </div>
                  {selectedDoctor.university && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("colUniversity")}
                      </span>
                      <span className="text-foreground font-medium text-right max-w-[60%]">
                        {selectedDoctor.university}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDoctor(null);
                    setSearchDone(false);
                    setDoctors([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
                >
                  {t("searchAgain")}
                </button>
              </div>
            </motion.div>
          )}

          {/* NMC — multiple results table */}
          {!isIndonesia && !selectedDoctor && doctors.length > 1 && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <p className="text-sm text-muted-foreground mb-3">
                {t("doctorsFound", { count: doctors.length })}
              </p>
              <div className="rounded-xl border border-border/50 overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        {t("colName")}
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        {t("colRegNo")}
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        {t("colCouncil")}
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        {t("colYear")}
                      </th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor, i) => (
                      <tr
                        key={`${doctor.doctorId}-${i}`}
                        className="border-t border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => handleSelectDoctor(doctor)}
                      >
                        <td className="px-4 py-2.5 text-foreground font-medium">
                          {doctor.name}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {doctor.registrationNo}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {doctor.council}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {doctor.yearOfInfo}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-primary hover:underline">
                            {t("selectBtn")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detailLoading && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t("fetchingDetails")}
                </div>
              )}
            </motion.div>
          )}

          {/* No results (NMC only) */}
          {!isIndonesia &&
            searchDone &&
            !selectedDoctor &&
            doctors.length === 0 && (
              <motion.div
                key="noresults"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <p className="text-sm text-muted-foreground">
                  {t("noResults")}
                </p>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Actions — pinned bottom */}
      <div className="flex-shrink-0 flex justify-between items-center pt-6 pb-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          {tc("back")}
        </Button>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleContinue}
            disabled={loading || detailLoading}
            size="lg"
          >
            {tc("continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
