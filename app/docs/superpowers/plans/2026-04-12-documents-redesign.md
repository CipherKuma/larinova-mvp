# Documents Page Redesign — Print Preview + Inline Editing + Consultation Backlink

> **For agentic workers:** Pick ONE of three sanctioned execution paths:
> 1. **`superpowers:executing-plans`** — sequential execution with built-in checkpoints (default for most plans)
> 2. **cmux-teams** — parallel execution across 3+ independent workstreams via cmux tabs (see `~/.claude/rules/cmux-teams.md`)
> 3. **`superpowers:subagent-driven-development`** — fresh subagent per task, fastest iteration (for plans with clear task boundaries)
>
> **Fresh session guidance**: This plan has 8 tasks across 7+ files — prefer a fresh Claude Code session to avoid stale context.
>
> **Testing flow**: No explicit test flow in CLAUDE.md for app. Use: implement → typecheck (`npx tsc --noEmit` in `app/`) → visual verification via Playwright MCP at `http://localhost:3000`.
>
> **Verification between tasks**: the executing skills automatically invoke `superpowers:verification-before-completion` before marking each task as done.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-markdown document detail panel with a print-preview paper card featuring per-field inline editing and a clickable consultation backlink.

**Architecture:** Parse stored markdown into named sections client-side; render each section as a click-to-edit field on a white serif paper card. Markdown is never visible to the doctor. Sections serialize back to markdown on blur and autosave via the existing PATCH endpoint.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase, existing shadcn/ui components, html2pdf.js (unchanged)

**Project flow reference:** Read `app/CLAUDE.md` for project-specific conventions.

---

## File Map

**New files:**
- `lib/documents/parse-sections.ts` — markdown ↔ Section[] parser
- `components/documents/EditableField.tsx` — single-line click-to-edit field
- `components/documents/EditableSection.tsx` — multi-line click-to-edit textarea
- `components/documents/DocumentPrintPreview.tsx` — white paper card component
- `components/documents/DocumentsSidebar.tsx` — folder sidebar (extracted from page.tsx)
- `components/documents/DocumentsList.tsx` — document list panel (extracted from page.tsx)

**Modified files:**
- `types/helena.ts` — add `DocumentWithPatient` export with consultation field
- `app/api/documents/route.ts` — add consultation join to select
- `app/api/documents/[id]/route.ts` — add consultation join to GET select
- `app/[locale]/(protected)/documents/page.tsx` — slim to shell + wire new components

---

### Task 1: Add consultation join to API routes and export DocumentWithPatient type

This makes `consultation_code` available in document data, and moves `DocumentWithPatient` from its inline definition in `page.tsx` to a shared type used by all new components.

**Files:**
- Modify: `types/helena.ts`
- Modify: `app/api/documents/route.ts`
- Modify: `app/api/documents/[id]/route.ts`

- [ ] **Step 1: Add `DocumentWithPatient` to `types/helena.ts`**

Add this block at the end of `types/helena.ts`, after the `DOCUMENT_TYPES` const and before `HelenaChatRequest`:

```ts
// Document with joined patient, doctor, and consultation data
export interface DocumentWithPatient extends HelenaDocument {
  patient?: {
    id: string;
    full_name: string;
    patient_code: string;
    date_of_birth?: string;
    gender?: string;
  } | null;
  doctor?: {
    id: string;
    full_name: string;
    specialization?: string;
    license_number?: string;
  } | null;
  consultation?: {
    id: string;
    consultation_code: string;
  } | null;
}
```

- [ ] **Step 2: Update the select string in `app/api/documents/route.ts`**

Replace the existing `.select(...)` call (lines 35–42) with:

```ts
let query = supabase
  .from("larinova_documents")
  .select(
    `
    *,
    patient:larinova_patients(id, full_name, patient_code, date_of_birth, gender),
    consultation:larinova_consultations(id, consultation_code)
  `,
  )
  .eq("doctor_id", doctor.id)
  .order("created_at", { ascending: false });
```

- [ ] **Step 3: Update the select string in `app/api/documents/[id]/route.ts`**

Replace the existing `.select(...)` in the GET handler (lines 22–30) with:

```ts
const { data: document, error } = await supabase
  .from("larinova_documents")
  .select(
    `
    *,
    patient:larinova_patients(id, full_name, patient_code, date_of_birth, gender),
    doctor:larinova_doctors(id, full_name, specialization, license_number),
    consultation:larinova_consultations(id, consultation_code)
  `,
  )
  .eq("id", documentId)
  .single();
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing unrelated errors — do not fix those now).

- [ ] **Step 5: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add types/helena.ts app/api/documents/route.ts app/api/documents/[id]/route.ts
git commit -m "feat: add consultation join to document API and export DocumentWithPatient type"
```

---

### Task 2: Create the section parser utility

Parses a markdown string into `Section[]` (title + body pairs) and serializes back. This is pure logic with no UI dependencies.

**Files:**
- Create: `lib/documents/parse-sections.ts`

- [ ] **Step 1: Create `lib/documents/parse-sections.ts`**

```ts
export interface Section {
  title: string; // e.g. "Subjective" — empty string for untitled preamble blocks
  body: string;  // plain text, no markdown syntax
}

/**
 * Splits a markdown string on ## headings into Section[].
 * Content before the first ## becomes a section with title "".
 * If no ## headings exist at all, returns a single section with title "" and full content as body.
 */
export function parseSections(markdown: string): Section[] {
  if (!markdown?.trim()) return [{ title: "", body: "" }];

  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];
  let hasHeadings = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      hasHeadings = true;
      // flush current section
      const body = currentLines.join("\n").trim();
      if (body || currentTitle) {
        sections.push({ title: currentTitle, body });
      }
      currentTitle = line.replace(/^## /, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // flush last section
  const lastBody = currentLines.join("\n").trim();
  if (lastBody || currentTitle) {
    sections.push({ title: currentTitle, body: lastBody });
  }

  // fallback: no ## headings at all
  if (!hasHeadings) {
    return [{ title: "", body: markdown.trim() }];
  }

  return sections;
}

/**
 * Serializes Section[] back to markdown with ## headings.
 * Sections with empty title are written as plain body text.
 */
export function serializeSections(sections: Section[]): string {
  return sections
    .map((s) => (s.title ? `## ${s.title}\n\n${s.body}` : s.body))
    .join("\n\n");
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add lib/documents/parse-sections.ts
git commit -m "feat: add markdown section parser utility"
```

---

### Task 3: Create the EditableField component (single-line)

Extracted and generalized from `StepPrescription.tsx`. Click-to-edit inline input with dashed-underline hover hint. Doctors see no markdown — just the text value.

**Files:**
- Create: `components/documents/EditableField.tsx`

- [ ] **Step 1: Create `components/documents/EditableField.tsx`**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";

export interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function EditableField({
  value,
  onChange,
  className = "",
  inputClassName = "",
  placeholder = "",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed) {
      onChange(trimmed);
    } else {
      setDraft(value); // revert if emptied
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        className={`bg-transparent border-b border-primary/50 outline-none text-black ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`cursor-pointer border-b border-dashed border-gray-300 hover:border-primary/50 hover:text-primary/80 transition-colors ${className}`}
    >
      {value || <span className="text-gray-400 italic text-xs">{placeholder}</span>}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add components/documents/EditableField.tsx
git commit -m "feat: add EditableField inline click-to-edit component"
```

---

### Task 4: Create the EditableSection component (multi-line)

Auto-resizing textarea that appears on click. Used for paragraph-length document sections (Subjective, Objective, etc.). Transcript sections are read-only.

**Files:**
- Create: `components/documents/EditableSection.tsx`

- [ ] **Step 1: Create `components/documents/EditableSection.tsx`**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";

export interface EditableSectionProps {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export function EditableSection({
  value,
  onChange,
  readOnly = false,
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [editing]);

  if (readOnly) {
    return (
      <p className="text-sm leading-relaxed text-black whitespace-pre-wrap">
        {value}
      </p>
    );
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          autoResize(e.target);
        }}
        onBlur={() => {
          setEditing(false);
          onChange(draft.trim() || value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        className="w-full resize-none overflow-hidden bg-transparent border-b border-primary/50 outline-none text-sm leading-relaxed text-black"
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className="text-sm leading-relaxed text-black whitespace-pre-wrap cursor-pointer border-b border-dashed border-transparent hover:border-gray-300 transition-colors min-h-[1.5rem]"
    >
      {value || (
        <span className="text-gray-400 italic text-xs">
          Empty — click to add content
        </span>
      )}
    </p>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add components/documents/EditableSection.tsx
git commit -m "feat: add EditableSection auto-resize click-to-edit component"
```

---

### Task 5: Create the DocumentPrintPreview component

The white paper card. Renders like the printed output. Doctors see the document as it will look on paper. Each section is click-to-edit. Autosaves on blur. Shows consultation backlink if available.

**Files:**
- Create: `components/documents/DocumentPrintPreview.tsx`

- [ ] **Step 1: Create `components/documents/DocumentPrintPreview.tsx`**

```tsx
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
  const isReadOnly = document.document_type === "transcript";
  const [sections, setSections] = useState<Section[]>(() =>
    parseSections(document.content),
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reset sections when document changes
  useEffect(() => {
    setSections(parseSections(document.content));
    setSaveStatus("idle");
  }, [document.id, document.content]);

  const flashSaveStatus = useCallback(
    (status: "saved" | "error") => {
      setSaveStatus(status);
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
    },
    [],
  );

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
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add components/documents/DocumentPrintPreview.tsx
git commit -m "feat: add DocumentPrintPreview paper card with inline editing and consultation backlink"
```

---

### Task 6: Extract DocumentsSidebar component

Pulls the folder sidebar out of `page.tsx` into its own file. Self-contained — manages its own `expandedFolders` state internally.

**Files:**
- Create: `components/documents/DocumentsSidebar.tsx`

- [ ] **Step 1: Create `components/documents/DocumentsSidebar.tsx`**

```tsx
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
                const count =
                  folder.id === "all"
                    ? totalCount
                    : documentCounts[folder.id] || 0;
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
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add components/documents/DocumentsSidebar.tsx
git commit -m "feat: extract DocumentsSidebar component"
```

---

### Task 7: Extract DocumentsList component

Pulls the document list panel (toolbar + list/grid views) out of `page.tsx`. Manages its own `viewMode` and `searchQuery` state internally.

**Files:**
- Create: `components/documents/DocumentsList.tsx`

- [ ] **Step 1: Create `components/documents/DocumentsList.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  FileText,
  Search,
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
import { DocumentType, DOCUMENT_TYPES, DocumentWithPatient } from "@/types/helena";

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
              const docInfo =
                DOCUMENT_TYPES[doc.document_type as DocumentType];
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
              const docInfo =
                DOCUMENT_TYPES[doc.document_type as DocumentType];
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
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add components/documents/DocumentsList.tsx
git commit -m "feat: extract DocumentsList component with consultation code in subtitle"
```

---

### Task 8: Rewrite page.tsx — slim shell wiring all components together

Replace the 927-line monolith with a ~200-line shell. Drop the old `isEditing`/`editedTitle`/`editedContent`/`saving` state. Wire `DocumentPrintPreview` into the detail panel. The old detail panel (with ReactMarkdown + Textarea) is fully replaced.

**Files:**
- Modify: `app/[locale]/(protected)/documents/page.tsx`

- [ ] **Step 1: Replace the full contents of `page.tsx`**

```tsx
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
import { DocumentType, DOCUMENT_TYPES, DocumentWithPatient } from "@/types/helena";
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
  const printableRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const td = useTranslations("documents");

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

  const handleDeleteDocument = async (
    documentId: string,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    if (!confirm(td("deleteConfirm"))) return;
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (selectedDocument?.id === documentId) setSelectedDocument(null);
        loadDocuments();
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
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
    (doc) =>
      selectedFolder === "all" || doc.document_type === selectedFolder,
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
    <div className="h-[calc(100vh-120px)] flex gap-0 overflow-hidden rounded-lg">
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
                return <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
              })()}
              <div className="min-w-0 flex-1">
                <EditableField
                  value={selectedDocument.title}
                  onChange={(title) => handleSave({ title })}
                  className="text-base font-bold text-foreground"
                  inputClassName="text-base font-bold w-full"
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

          {/* Print preview */}
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
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("sent")}
                  >
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
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npx tsc --noEmit 2>&1 | head -50
```

Fix any type errors before proceeding.

- [ ] **Step 3: Verify the app loads at `http://localhost:3000`**

Open the documents page in the browser (Playwright MCP):
- Navigate to the `/documents` route
- Confirm the three-panel layout renders (sidebar + list + detail)
- Click a document — verify the white paper card appears with serif font
- Verify section headings render in small-caps (SUBJECTIVE, OBJECTIVE, etc.)
- Verify clicking a section body enters edit mode (textarea appears)
- Verify typing and blurring shows "Saved ✓" briefly
- If the document has a `consultation_id`, verify the "Consultation #CODE ↗" link appears
- Click the consultation link — verify it navigates to `/consultations/[id]/summary`
- Click Print — verify a print dialog opens with the white card output
- Verify the document title in the header is click-to-edit

- [ ] **Step 4: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add app/[locale]/\(protected\)/documents/page.tsx
git commit -m "feat: rewrite documents page with print-preview card, inline editing, and consultation backlink"
```
