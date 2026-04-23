"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DocumentType, DOCUMENT_TYPES } from "@/types/helena";

type FolderEntry = {
  id: DocumentType | "all";
  label: string;
  icon: LucideIcon;
};

interface DocumentsSidebarProps {
  selectedFolder: DocumentType | "all";
  onSelectFolder: (id: DocumentType | "all") => void;
  documentCounts: Record<string, number>;
  totalCount: number;
  labels: {
    folders: string;
    allDocuments: string;
    consultationSummaries: string;
    soapNotes: string;
    referralLetters: string;
    medicalCertificates: string;
    insuranceReports: string;
    fitnessToWork: string;
    disabilityReports: string;
    transferSummaries: string;
    prescriptionLetters: string;
    general: string;
  };
}

export function DocumentsSidebar({
  selectedFolder,
  onSelectFolder,
  documentCounts,
  totalCount,
  labels,
}: DocumentsSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["all"]),
  );

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const FOLDERS: FolderEntry[] = [
    { id: "all", label: labels.allDocuments, icon: FolderOpen },
    {
      id: "consultation_summary",
      label: labels.consultationSummaries,
      icon: DOCUMENT_TYPES.consultation_summary.icon,
    },
    {
      id: "soap_note",
      label: labels.soapNotes,
      icon: DOCUMENT_TYPES.soap_note.icon,
    },
    {
      id: "referral_letter",
      label: labels.referralLetters,
      icon: DOCUMENT_TYPES.referral_letter.icon,
    },
    {
      id: "medical_certificate",
      label: labels.medicalCertificates,
      icon: DOCUMENT_TYPES.medical_certificate.icon,
    },
    {
      id: "insurance_report",
      label: labels.insuranceReports,
      icon: DOCUMENT_TYPES.insurance_report.icon,
    },
    {
      id: "fitness_to_work",
      label: labels.fitnessToWork,
      icon: DOCUMENT_TYPES.fitness_to_work.icon,
    },
    {
      id: "disability_report",
      label: labels.disabilityReports,
      icon: DOCUMENT_TYPES.disability_report.icon,
    },
    {
      id: "transfer_summary",
      label: labels.transferSummaries,
      icon: DOCUMENT_TYPES.transfer_summary.icon,
    },
    {
      id: "prescription_letter",
      label: labels.prescriptionLetters,
      icon: DOCUMENT_TYPES.prescription_letter.icon,
    },
    {
      id: "general",
      label: labels.general,
      icon: DOCUMENT_TYPES.general.icon,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {labels.folders}
      </h2>
      <div className="space-y-1">
        <div>
          <button
            onClick={() => {
              onSelectFolder("all");
              toggleFolder("all");
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
              selectedFolder === "all"
                ? "bg-muted text-foreground font-medium"
                : "hover:bg-muted/50 text-foreground"
            }`}
          >
            {expandedFolders.has("all") ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <FolderOpen className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">
              {labels.allDocuments}
            </span>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </button>

          {expandedFolders.has("all") && (
            <div className="ml-4 mt-1 space-y-1">
              {FOLDERS.filter((f) => f.id !== "all").map((folder) => {
                const count = documentCounts[folder.id] || 0;
                const isSelected = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all ${
                      isSelected
                        ? "bg-muted text-foreground font-medium"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <folder.icon className="w-4 h-4" />
                    <span className="flex-1 truncate text-xs">
                      {folder.label}
                    </span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
