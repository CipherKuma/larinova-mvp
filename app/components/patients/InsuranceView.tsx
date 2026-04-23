"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface Insurance {
  id: string;
  provider_name: string;
  policy_number: string;
  coverage_type: string | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export default function InsuranceView({ patientId }: { patientId: string }) {
  const t = useTranslations("patients");
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsurance() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("larinova_insurance")
        .select("*")
        .eq("patient_id", patientId)
        .order("is_active", { ascending: false })
        .order("valid_until", { ascending: false });

      if (error) {
        console.error("Error fetching insurance:", error);
      } else {
        setInsurance(data || []);
      }
      setLoading(false);
    }

    fetchInsurance();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-muted-foreground">
          {t("loadingInsurance")}
        </div>
      </div>
    );
  }

  if (insurance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          {t("noInsuranceTitle")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("noInsuranceDesc")}
        </div>
      </div>
    );
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {insurance.map((policy) => (
        <div
          key={policy.id}
          className={`glass-card p-5 transition-all hover:shadow-md ${
            policy.is_active && !isExpired(policy.valid_until)
              ? "border-l-4 border-foreground"
              : "opacity-75"
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-foreground text-lg">
              {policy.provider_name}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded capitalize font-medium border ${
                policy.is_active && !isExpired(policy.valid_until)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {policy.is_active && !isExpired(policy.valid_until)
                ? t("insuranceActive")
                : t("insuranceInactive")}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground font-medium mb-1">
                {t("policyNumber")}
              </div>
              <div className="text-sm text-foreground font-mono">
                {policy.policy_number}
              </div>
            </div>

            {policy.coverage_type && (
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  {t("coverageType")}
                </div>
                <div className="text-sm text-foreground">
                  {policy.coverage_type}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  {t("validFrom")}
                </div>
                <div className="text-sm text-foreground">
                  {new Date(policy.valid_from).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  {t("validUntil")}
                </div>
                <div
                  className={`text-sm ${isExpired(policy.valid_until) ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {new Date(policy.valid_until).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
