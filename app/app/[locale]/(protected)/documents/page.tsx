"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FileText,
  ArrowLeft,
  Download,
  Printer,
  Trash2,
  X,
  CheckCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DocumentType,
  DOCUMENT_TYPES,
  DocumentWithPatient,
} from "@/types/helena";
import { DocumentsSidebar } from "@/components/documents/DocumentsSidebar";
import { DocumentsList } from "@/components/documents/DocumentsList";
import { DocumentPrintPreview } from "@/components/documents/DocumentPrintPreview";
import { EditableField } from "@/components/documents/EditableField";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithPatient[]>([]);
  const [documentsByType, setDocumentsByType] = useState<
    Record<string, DocumentWithPatient[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<DocumentType | "all">(
    "all",
  );
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentWithPatient | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  const locale = params.locale as string;
  const td = useTranslations("documents");
  const tc = useTranslations("common");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setDocumentsByType(data.documentsByType || {});
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = async (doc: DocumentWithPatient) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedDocument(data.document);
      }
    } catch (error) {
      console.error("Failed to load document:", error);
    }
  };

  const handleSave = useCallback(
    async (patch: { title?: string; content?: string }) => {
      if (!selectedDocument) return;
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("Save failed");
      const data = await response.json();
      setSelectedDocument((prev) =>
        prev ? { ...prev, ...data.document } : prev,
      );
      if (patch.title) loadDocuments();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDocument],
  );

  const handleStatusChange = async (status: "draft" | "finalized" | "sent") => {
    if (!selectedDocument) return;
    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedDocument((prev) =>
          prev ? { ...prev, ...data.document } : prev,
        );
        loadDocuments();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteDocument = (documentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetId(documentId);
  };

  const confirmDeleteDocument = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (selectedDocument?.id === deleteTargetId) setSelectedDocument(null);
        loadDocuments();
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handlePrint = () => {
    if (!printableRef.current || !selectedDocument) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedDocument.title}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printableRef.current.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = async () => {
    if (!selectedDocument || !printableRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${selectedDocument.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "portrait" as const,
        },
      };
      await html2pdf().set(opt).from(printableRef.current).save();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const folderLabel =
    selectedFolder === "all"
      ? td("allDocuments")
      : DOCUMENT_TYPES[selectedFolder as DocumentType]?.label ||
        td("allDocuments");

  const filteredDocuments = documents.filter(
    (doc) => selectedFolder === "all" || doc.document_type === selectedFolder,
  );

  const documentCounts = Object.fromEntries(
    Object.entries(documentsByType).map(([k, v]) => [k, v.length]),
  );

  const sidebarLabels = {
    folders: "Folders",
    allDocuments: td("allDocuments"),
    consultationSummaries: td("consultationSummaries"),
    soapNotes: td("soapNotes"),
    referralLetters: td("referralLetters"),
    medicalCertificates: td("medicalCertificates"),
    insuranceReports: td("insuranceReports"),
    fitnessToWork: td("fitnessToWork"),
    disabilityReports: td("disabilityReports"),
    transferSummaries: td("transferSummaries"),
    prescriptionLetters: td("prescriptionLetters"),
    general: td("general"),
  };

  return (
    <div className="h-[calc(100dvh-180px)] md:h-[calc(100vh-120px)] flex gap-0 overflow-hidden rounded-lg">
      {/* Sidebar */}
      <div
        className={`w-44 min-[1200px]:w-56 flex-shrink-0 glass-card rounded-none border-r border-border overflow-y-auto hidden min-[800px]:block ${
          selectedDocument ? "min-[800px]:hidden min-[1200px]:block" : ""
        }`}
      >
        <DocumentsSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          documentCounts={documentCounts}
          totalCount={documents.length}
          labels={sidebarLabels}
        />
      </div>

      {/* Document list */}
      <DocumentsList
        documents={filteredDocuments}
        selectedDocument={selectedDocument}
        loading={loading}
        folderLabel={folderLabel}
        locale={locale}
        onDocumentClick={handleDocumentClick}
        onDeleteDocument={handleDeleteDocument}
        onBackToFolders={() => setSelectedDocument(null)}
        labels={{
          noDocumentsFound: td("noDocumentsFound"),
          noDocumentsHint: "Complete consultations to generate documents",
        }}
      />

      {/* Detail panel */}
      {selectedDocument && (
        <div className="flex-1 flex flex-col overflow-hidden border-l border-border glass-card rounded-none">
          {/* Detail header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                className="h-8 w-8 flex-shrink-0 min-[800px]:hidden inline-flex items-center justify-center rounded-md hover:bg-muted/50"
                onClick={() => setSelectedDocument(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              {(() => {
                const Icon =
                  DOCUMENT_TYPES[selectedDocument.document_type as DocumentType]
                    ?.icon || FileText;
                return (
                  <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                );
              })()}
              <div className="min-w-0 flex-1">
                <EditableField
                  value={selectedDocument.title}
                  onChange={(title) => handleSave({ title })}
                  className="text-base font-bold text-foreground"
                  inputClassName="text-base font-bold w-full text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeleteDocument(selectedDocument.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden min-[800px]:inline-flex"
                onClick={() => setSelectedDocument(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Print preview — key resets component state when document changes */}
          <DocumentPrintPreview
            key={selectedDocument.id}
            document={selectedDocument}
            locale={locale}
            onSave={handleSave}
            printableRef={printableRef}
          />

          {/* Status actions */}
          <div className="flex-shrink-0 p-3 border-t border-border">
            <div className="flex gap-2">
              {selectedDocument.status === "draft" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("finalized")}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {td("finalize")}
                </Button>
              )}
              {selectedDocument.status === "finalized" && (
                <>
                  <Button size="sm" onClick={() => handleStatusChange("sent")}>
                    <Send className="w-3 h-3 mr-1" />
                    {td("markAsSent")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("draft")}
                  >
                    {td("revertToDraft")}
                  </Button>
                </>
              )}
              {selectedDocument.status === "sent" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("finalized")}
                >
                  {td("revertToFinalized")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTargetId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tc("delete")}</DialogTitle>
            <DialogDescription>{td("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
              disabled={deleting}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteDocument}
              disabled={deleting}
            >
              {deleting ? "..." : tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
