"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Send, ExternalLink } from "lucide-react";
import {
  DocumentType,
  DOCUMENT_TYPES,
  DocumentWithPatient,
} from "@/types/helena";
import { EditableSection } from "./EditableSection";
import {
  parseSections,
  serializeSections,
  Section,
} from "@/lib/documents/parse-sections";

interface DocumentPrintPreviewProps {
  document: DocumentWithPatient;
  locale: string;
  onSave: (patch: { title?: string; content?: string }) => Promise<void>;
  printableRef: React.RefObject<HTMLDivElement | null>;
}

export function DocumentPrintPreview({
  document,
  locale,
  onSave,
  printableRef,
}: DocumentPrintPreviewProps) {
  const isReadOnly = (document.document_type as string) === "transcript";
  const [sections, setSections] = useState<Section[]>(() =>
    parseSections(document.content),
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Reset sections when document changes
  useEffect(() => {
    setSections(parseSections(document.content));
    setSaveStatus("idle");
  }, [document.id, document.content]);

  const flashSaveStatus = useCallback((status: "saved" | "error") => {
    setSaveStatus(status);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
  }, []);

  const updateSection = useCallback(
    async (index: number, body: string) => {
      const previous = sections;
      const newSections = sections.map((s, i) =>
        i === index ? { ...s, body } : s,
      );
      setSections(newSections);
      try {
        await onSave({ content: serializeSections(newSections) });
        flashSaveStatus("saved");
      } catch {
        setSections(previous); // revert on failure
        flashSaveStatus("error");
      }
    },
    [sections, onSave, flashSaveStatus],
  );

  const getPatientAge = () => {
    if (!document.patient?.date_of_birth) return null;
    const dob = new Date(document.patient.date_of_birth);
    const age = Math.floor(
      (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    return `${age} yrs`;
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case "draft":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case "finalized":
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-600 text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Finalized
          </Badge>
        );
      case "sent":
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-600 text-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      default:
        return null;
    }
  };

  const docInfo = DOCUMENT_TYPES[document.document_type as DocumentType];
  const patientAge = getPatientAge();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div
        ref={printableRef}
        className="bg-white text-black rounded-xl border border-gray-200 shadow-lg p-8 max-w-2xl mx-auto font-serif"
      >
        {/* Doctor header */}
        <div className="border-b-2 border-black pb-3 mb-4">
          <p className="text-lg font-bold">
            Dr. {document.doctor?.full_name || "Doctor"}
            {document.doctor?.specialization &&
              `, ${document.doctor.specialization}`}
          </p>
          {document.doctor?.license_number && (
            <p className="text-sm text-gray-600">
              Reg No: {document.doctor.license_number}
            </p>
          )}
        </div>

        {/* Patient row */}
        {document.patient && (
          <div className="flex flex-wrap items-start gap-6 text-sm mb-4 pb-3 border-b border-gray-200">
            <div>
              <span className="text-gray-500 text-xs block">Patient</span>
              <p className="font-medium">{document.patient.full_name}</p>
            </div>
            {patientAge && (
              <div>
                <span className="text-gray-500 text-xs block">Age</span>
                <p className="font-medium">{patientAge}</p>
              </div>
            )}
            {document.patient.gender && (
              <div>
                <span className="text-gray-500 text-xs block">Sex</span>
                <p className="font-medium capitalize">
                  {document.patient.gender}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Document meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {docInfo && (
            <Badge
              variant="outline"
              className="text-xs border-gray-300 text-gray-600"
            >
              <docInfo.icon className="w-3 h-3 mr-1" />
              {docInfo.label}
            </Badge>
          )}
          {getStatusBadge()}
          {isReadOnly && (
            <Badge
              variant="outline"
              className="text-xs border-gray-300 text-gray-500"
            >
              Read-only
            </Badge>
          )}
        </div>

        {/* Consultation backlink */}
        {document.consultation && (
          <div className="mb-4">
            <Link
              href={`/${locale}/consultations/${document.consultation.id}/summary`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Consultation #{document.consultation.consultation_code}
            </Link>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-5 mt-4">
          {sections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-1">
                  {section.title}
                </p>
              )}
              <EditableSection
                value={section.body}
                onChange={(body) => updateSection(i, body)}
                readOnly={isReadOnly}
              />
            </div>
          ))}
        </div>

        {/* Signature */}
        <div className="border-t border-gray-300 pt-4 mt-8 text-right">
          <div className="w-32 border-b border-black mb-1 ml-auto h-6" />
          <p className="text-sm font-medium">
            Dr. {document.doctor?.full_name || "Doctor"}
          </p>
        </div>

        {/* Edit hint + save status */}
        <div className="flex items-center justify-between mt-3 pt-2">
          {!isReadOnly ? (
            <p className="text-xs text-gray-400 italic">
              Click any field to edit
            </p>
          ) : (
            <span />
          )}
          <div>
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600">Saved ✓</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-red-500">Failed to save</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
