"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Send,
  Printer,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DocumentType, DOCUMENT_TYPES, HelenaDocument } from "@/types/helena";

interface DocumentWithDetails extends HelenaDocument {
  patient?: {
    id: string;
    full_name: string;
    patient_code: string;
    date_of_birth: string;
    gender: string;
  } | null;
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
    license_number: string;
  } | null;
}

export default function DocumentDetailPage() {
  const [document, setDocument] = useState<DocumentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const documentId = params.id as string;
  const t = useTranslations();
  const td = useTranslations("documents");

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
        setEditedTitle(data.document.title);
        setEditedContent(data.document.content);
      } else {
        router.push(`/${locale}/documents`);
      }
    } catch (error) {
      console.error("Failed to load document:", error);
      router.push(`/${locale}/documents`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!document) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument({ ...document, ...data.document });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: "draft" | "finalized" | "sent") => {
    if (!document) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument({ ...document, ...data.document });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(td("deleteConfirm"))) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/${locale}/documents`);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handlePrint = () => {
    if (!printableRef.current || !document) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const docInfo = DOCUMENT_TYPES[document.document_type as DocumentType];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1a1a1a;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #e5e5e5;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 10px 0;
            }
            .meta {
              color: #666;
              font-size: 14px;
            }
            .content h1, .content h2, .content h3 {
              margin-top: 24px;
              margin-bottom: 12px;
            }
            .content p {
              margin-bottom: 12px;
            }
            .content ul, .content ol {
              margin-bottom: 12px;
              padding-left: 24px;
            }
            .content li {
              margin-bottom: 6px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${document.title}</h1>
            <p class="meta">${docInfo?.label || "Document"} • Created: ${new Date(document.created_at).toLocaleDateString()}</p>
          </div>
          <div class="content">
            ${printableRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            {td("statusDraft")}
          </Badge>
        );
      case "finalized":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            {td("statusFinalized")}
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            <Send className="w-3 h-3 mr-1" />
            {td("statusSent")}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
        <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">{td("notFound")}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/documents`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {td("backToDocuments")}
        </Button>
      </div>
    );
  }

  const docInfo = DOCUMENT_TYPES[document.document_type as DocumentType];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/documents`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const Icon = docInfo?.icon || FileText;
                  return <Icon className="w-7 h-7 text-muted-foreground" />;
                })()}
                {isEditing ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold h-auto py-1"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">
                    {document.title}
                  </h1>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {docInfo?.label || t("chat.documentFallback")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(document.created_at)}
                </span>
                {getStatusBadge(document.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? td("saving") : td("save")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t("common.edit")}
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  {td("print")}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Document Content */}
        <div className="col-span-2">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {td("documentContent")}
            </h2>

            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Document content..."
              />
            ) : (
              <div className="bg-background border-2 border-border rounded-xl p-6 min-h-[500px]">
                <div
                  ref={printableRef}
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
                >
                  <ReactMarkdown>{document.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info */}
          {document.patient && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {td("patient")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {document.patient.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {document.patient.patient_code}
                    </p>
                  </div>
                </div>
                {document.patient.date_of_birth && (
                  <p className="text-sm text-muted-foreground">
                    {td("dob")}{" "}
                    {new Date(
                      document.patient.date_of_birth,
                    ).toLocaleDateString()}
                  </p>
                )}
                {document.patient.gender && (
                  <p className="text-sm text-muted-foreground">
                    {td("gender")} {document.patient.gender}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Doctor Info */}
          {document.doctor && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {td("createdBy")}
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  Dr. {document.doctor.full_name}
                </p>
                {document.doctor.specialization && (
                  <p className="text-sm text-muted-foreground">
                    {document.doctor.specialization}
                  </p>
                )}
                {document.doctor.license_number && (
                  <p className="text-sm text-muted-foreground">
                    {td("license")} {document.doctor.license_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {td("actions")}
            </h3>
            <div className="space-y-2">
              {document.status === "draft" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("finalized")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {td("markAsFinalized")}
                </Button>
              )}
              {document.status === "finalized" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("sent")}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {td("markAsSent")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange("draft")}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {td("revertToDraft")}
                  </Button>
                </>
              )}
              {document.status === "sent" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange("finalized")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {td("revertToFinalized")}
                </Button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {td("details")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{td("created")}</span>
                <span className="text-foreground">
                  {formatDate(document.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{td("updated")}</span>
                <span className="text-foreground">
                  {formatDate(document.updated_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{td("type")}</span>
                <span className="text-foreground">{docInfo?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{td("status")}</span>
                <span className="text-foreground capitalize">
                  {document.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
