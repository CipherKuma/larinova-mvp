"use client";

import { useState } from "react";
import {
  FileText,
  Grid3X3,
  List,
  MoreHorizontal,
  Trash2,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DocumentType,
  DOCUMENT_TYPES,
  DocumentWithPatient,
} from "@/types/helena";

type ViewMode = "list" | "grid";

interface DocumentsListProps {
  documents: DocumentWithPatient[];
  selectedDocument: DocumentWithPatient | null;
  loading: boolean;
  folderLabel: string;
  locale: string;
  onDocumentClick: (doc: DocumentWithPatient) => void;
  onDeleteDocument: (id: string, e?: React.MouseEvent) => void;
  onBackToFolders?: () => void;
  labels: {
    noDocumentsFound: string;
    noDocumentsHint: string;
  };
}

export function DocumentsList({
  documents,
  selectedDocument,
  loading,
  folderLabel,
  locale,
  onDocumentClick,
  onDeleteDocument,
  onBackToFolders,
  labels,
}: DocumentsListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filtered = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.patient?.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`flex flex-col overflow-hidden transition-all glass-card rounded-none ${
        selectedDocument
          ? "hidden min-[800px]:flex w-56 min-[1200px]:w-72"
          : "flex-1"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          {onBackToFolders && (
            <button
              type="button"
              className="h-7 w-7 min-[1200px]:hidden inline-flex items-center justify-center rounded-md hover:bg-muted/50"
              onClick={onBackToFolders}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-sm font-semibold text-foreground">
            {folderLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            ({filtered.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden min-[1200px]:block">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 h-8 w-40 text-xs"
            />
          </div>

          {!selectedDocument && (
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                <Grid3X3 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              {labels.noDocumentsFound}
            </p>
            <p className="text-xs text-muted-foreground">
              {labels.noDocumentsHint}
            </p>
          </div>
        ) : viewMode === "list" || selectedDocument ? (
          <div className="space-y-1">
            {filtered.map((doc) => {
              const docInfo = DOCUMENT_TYPES[doc.document_type as DocumentType];
              const isSelected = selectedDocument?.id === doc.id;
              const subtitle = [
                doc.patient?.full_name || docInfo?.label,
                doc.consultation?.consultation_code,
                formatDate(doc.created_at),
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <div
                  key={doc.id}
                  onClick={() => onDocumentClick(doc)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "bg-muted border border-border"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  {docInfo?.icon ? (
                    <docInfo.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  </div>
                  {!selectedDocument && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDocumentClick(doc)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) =>
                            onDeleteDocument(
                              doc.id,
                              e as unknown as React.MouseEvent,
                            )
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((doc) => {
              const docInfo = DOCUMENT_TYPES[doc.document_type as DocumentType];
              return (
                <div
                  key={doc.id}
                  onClick={() => onDocumentClick(doc)}
                  className="glass-card p-3 hover:border-primary/50 cursor-pointer transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    {docInfo?.icon ? (
                      <docInfo.icon className="w-8 h-8 text-muted-foreground mb-2" />
                    ) : (
                      <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                    )}
                    <p className="font-medium text-foreground text-sm truncate w-full">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
