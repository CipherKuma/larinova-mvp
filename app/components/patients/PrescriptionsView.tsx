"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
}

interface Prescription {
  id: string;
  prescription_code: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  doctor_notes: string | null;
  follow_up_date: string | null;
  status: string;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  items: PrescriptionItem[];
  doctor: {
    full_name: string;
    specialization: string | null;
  } | null;
}

export default function PrescriptionsView({
  patientId,
}: {
  patientId: string;
}) {
  const t = useTranslations("patients");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrescriptions() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("larinova_prescriptions")
        .select(
          `
          *,
          items:larinova_prescription_items (*),
          doctor:larinova_doctors!doctor_id (
            full_name,
            specialization
          )
        `,
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prescriptions:", error);
      } else {
        setPrescriptions(data || []);
      }
      setLoading(false);
    }

    fetchPrescriptions();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-muted-foreground">
          {t("loadingPrescriptions")}
        </div>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          {t("noPrescriptionsTitle")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("noPrescriptionsDesc")}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground border border-primary";
      case "completed":
        return "bg-secondary text-foreground border border-border";
      case "cancelled":
        return "bg-muted text-muted-foreground border border-border";
      default:
        return "bg-accent text-foreground border border-border";
    }
  };

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <div
          key={prescription.id}
          className="glass-card p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  {t("prescribedBy", {
                    name: prescription.doctor?.full_name || t("unknownDoctor"),
                  })}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded capitalize font-medium ${getStatusColor(prescription.status)}`}
                >
                  {prescription.status}
                </span>
                <span className="text-xs px-2 py-1 bg-secondary border border-border text-foreground rounded font-mono">
                  {prescription.prescription_code}
                </span>
              </div>
              {prescription.doctor?.specialization && (
                <p className="text-sm text-muted-foreground">
                  {prescription.doctor.specialization}
                </p>
              )}
            </div>
            <div className="text-sm font-medium text-foreground">
              {new Date(prescription.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          {prescription.doctor_notes && (
            <div className="mb-4 p-3 rounded-xl bg-secondary border border-border">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                {t("doctorNotes")}
              </div>
              <p className="text-sm text-foreground">
                {prescription.doctor_notes}
              </p>
            </div>
          )}

          {prescription.follow_up_date && (
            <div className="mb-4 text-sm">
              <span className="text-muted-foreground">{t("followUpDate")}</span>{" "}
              <span className="text-foreground font-medium">
                {new Date(prescription.follow_up_date).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                )}
              </span>
            </div>
          )}

          {prescription.items && prescription.items.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground font-medium mb-3">
                {t("medications")}
              </div>
              <div className="space-y-3">
                {prescription.items.map((item) => (
                  <div
                    key={item.id}
                    className="border-l-2 border-foreground pl-3"
                  >
                    <div className="font-medium text-foreground">
                      {item.medicine_name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t("dosage")}</span>{" "}
                      {item.dosage} - {item.frequency}
                      {item.duration && (
                        <span>
                          {" "}
                          {t("forDuration")} {item.duration}
                        </span>
                      )}
                    </div>
                    {item.instructions && (
                      <div className="text-sm text-muted-foreground mt-1 italic">
                        {item.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
