"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface HealthRecordField {
  key: string;
  value: string;
  unit?: string;
}

interface HealthRecordSection {
  name: string;
  fields: HealthRecordField[];
}

interface HealthRecordMetadata {
  sections?: HealthRecordSection[];
}

interface HealthRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  record_date: string;
  severity: string | null;
  metadata: HealthRecordMetadata | null;
  created_at: string;
}

export default function HealthRecordsView({
  patientId,
}: {
  patientId: string;
}) {
  const t = useTranslations("patients");
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("larinova_health_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("record_date", { ascending: false });

      if (error) {
        console.error("Error fetching health records:", error);
      } else {
        setRecords(data || []);
      }
      setLoading(false);
    }

    fetchRecords();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-sm text-muted-foreground">
          {t("loadingHealthRecords")}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          {t("noHealthRecordsTitle")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("noHealthRecordsDesc")}
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "high":
        return "bg-destructive text-white border border-destructive";
      case "medium":
        return "bg-primary text-primary-foreground border border-primary";
      case "low":
        return "bg-secondary text-foreground border border-border";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "diagnosis":
        return "bg-primary text-primary-foreground border border-primary";
      case "allergy":
        return "bg-destructive text-white border border-destructive";
      case "medication":
        return "bg-accent text-foreground border border-border";
      default:
        return "bg-secondary text-foreground border border-border";
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="glass-card p-5 hover:shadow-md transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3 pb-3 border-b border-border">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded capitalize font-medium ${getTypeColor(record.record_type)}`}
                >
                  {record.record_type.replace("_", " ")}
                </span>
                {record.severity && (
                  <span
                    className={`text-xs px-2 py-1 rounded capitalize font-medium ${getSeverityColor(record.severity)}`}
                  >
                    {record.severity}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground text-base">
                {record.title}
              </h3>
              {record.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {record.description}
                </p>
              )}
            </div>
          </div>

          {/* Metadata Sections */}
          {record.metadata?.sections && record.metadata.sections.length > 0 && (
            <div className="space-y-4 mb-4">
              {record.metadata.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {section.name}
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {section.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/20 transition-colors"
                      >
                        <span className="text-xs text-muted-foreground">
                          {field.key}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {field.value}
                          {field.unit && (
                            <span className="text-muted-foreground ml-1">
                              {field.unit}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Date Footer */}
          <div className="text-xs text-muted-foreground pt-3 border-t border-border">
            {new Date(record.record_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
