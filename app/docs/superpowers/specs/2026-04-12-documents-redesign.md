# Documents Page Redesign — Print Preview + Inline Editing + Consultation Backlink

**Date:** 2026-04-12  
**Status:** Approved  
**Scope:** `app/app/[locale]/(protected)/documents/page.tsx` + new components

---

## Problem

The current `/documents` page shows document content as raw rendered markdown in a plain card. Doctors:
- Cannot tell how the document will look when printed
- Must edit a raw textarea (full markdown blob) — confusing for non-technical users
- Have no way to trace a document back to the consultation it came from

---

## Solution Overview

1. **Print-preview card** — replace the markdown detail panel with a white paper card styled like the actual printed output (letterhead, patient row, sections)
2. **Inline field editing** — parse markdown into named sections; each section is click-to-edit, no markdown ever visible
3. **Consultation backlink** — if a document has a `consultation_id`, show a clickable pill linking to `/[locale]/consultations/[id]/summary`

---

## Architecture

### New files
- `components/documents/DocumentPrintPreview.tsx` — the paper card component (print preview + inline editing)
- `components/documents/EditableField.tsx` — single-line inline editable field (extracted from `StepPrescription`, made generic)
- `components/documents/EditableSection.tsx` — multi-line inline editable section (textarea, auto-resize)
- `lib/documents/parse-sections.ts` — parses markdown string → `Section[]`, serializes back

### Modified files
- `app/[locale]/(protected)/documents/page.tsx` — replace the detail panel content with `DocumentPrintPreview`

### Unchanged
- DB schema — content stays as markdown, `consultation_id` already exists on `larinova_documents`
- Core API logic — only the Supabase `select()` strings change to add the consultation join

### Changed
- `app/api/documents/route.ts` — add `consultation` join to select
- `app/api/documents/[id]/route.ts` — add `consultation` join to select
- `types/helena.ts` — extend `DocumentWithPatient` with `consultation` field

---

## Section Parser — `lib/documents/parse-sections.ts`

```ts
interface Section {
  title: string;   // e.g. "Subjective"
  body: string;    // plain text, no markdown syntax
}
```

**Parse:** Split markdown on `## ` headings. Each heading → `title`, everything until the next heading → `body` (stripped of leading/trailing whitespace).

**Serialize back:** `sections.map(s => `## ${s.title}\n\n${s.body}`).join('\n\n')`

**Fallback:** If no `##` headings found, return a single section with `title: ""` and `body: full content`. Renders as one editable textarea, no heading shown.

**Section titles per document type:**

| `document_type` | Expected section titles |
|---|---|
| `soap_note` | Subjective, Objective, Assessment, Plan |
| `consultation_summary` | Summary, Key Findings, Recommendations |
| `prescription_letter` | Medicines, Instructions, Notes |
| `referral_letter` | Reason for Referral, Clinical History, Requested Assessment |
| `medical_certificate` | Diagnosis, Fitness Status, Remarks |
| `transcript` | Full Transcript — rendered read-only, not editable |
| All others | Generic `##` split, or single block if no headings |

---

## Component: `EditableField` (single-line)

Extracted from `StepPrescription.tsx` with no logic changes. Props:

```ts
interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
}
```

- Click → becomes `<input>` with `bg-transparent border-b border-primary/50`
- Blur or Enter → saves, reverts to span
- Escape → cancels, reverts to original value
- Hover → dashed underline signals editability (no pencil icon, no button)

---

## Component: `EditableSection` (multi-line)

```ts
interface EditableSectionProps {
  value: string;
  onChange: (v: string) => void;
}
```

- Click → becomes `<textarea>` with `resize-none overflow-hidden` auto-sized to content height
- Auto-resize: `el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'` on each keystroke
- Blur → saves via `onChange`, reverts to `<p>` display
- Escape → cancels
- Same hover-underline hint as `EditableField`
- `transcript` type sections pass `readOnly` → no click-to-edit, no underline

---

## Component: `DocumentPrintPreview`

```ts
interface DocumentPrintPreviewProps {
  document: DocumentWithPatient;  // includes .doctor and .patient joins
  locale: string;
  onSave: (patch: { title?: string; content?: string }) => Promise<void>;
}
```

Doctor info (`full_name`, `specialization`, `license_number`) is read from `document.doctor` — already returned by `GET /api/documents/[id]` via the existing doctor join. No separate prop needed.

**Visual structure (white card, `font-serif`, `bg-white text-black` regardless of app theme):**

```
┌── Doctor header ────────────────────────────────┐
│  Dr. [full_name], [specialization]              │
│  Reg No: [license_number]                       │  ← from doctor profile
│  (clinic name from doctor profile if available) │
├── Patient row ──────────────────────────────────┤
│  [patient_name] · [age/DOB] · [gender]          │  ← from patient join
├── Document meta ────────────────────────────────┤
│  [DocumentType badge]  [Status badge]           │
│  📋 Consultation #CODE ↗                        │  ← if consultation_id present
│  [created_at formatted date]                    │
├── Sections (one per parsed section) ────────────┤
│  SECTION TITLE                                  │  ← small-caps, not editable
│  [EditableSection body]                         │
│  ...                                            │
├── Signature ────────────────────────────────────┤
│                          _______________        │
│                          Dr. [full_name]        │
└── Edit hint ────────────────────────────────────┘
  "Click any field to edit"         [Saved ✓]
```

**Styling:**
- Card: `bg-white text-black rounded-xl border border-gray-200 shadow-lg p-8 max-w-2xl mx-auto`
- Doctor header: `border-b-2 border-black pb-3 mb-4 font-serif`
- Section title: `text-xs font-semibold tracking-widest uppercase text-gray-500 mt-5 mb-1`
- Section body: `text-sm leading-relaxed text-black`
- Signature block: `border-t border-gray-300 pt-4 text-right`
- The white card sits inside a light gray `bg-gray-50` scroll area so it looks like a page in a document viewer

**Title editing:** Document title (shown above the card in the app chrome, not inside the card) remains click-to-edit via `EditableField`.

---

## Consultation Backlink

- Location: inside the document meta section of the print card
- Rendered only when `document.consultation_id` is non-null
- Display: `<Link href={`/${locale}/consultations/${consultation_id}/summary`}>📋 Consultation #{consultation_code} ↗</Link>`
- `consultation_code` comes from the consultation join (see API note below)
- Styling: `text-xs text-blue-600 hover:underline flex items-center gap-1`

**API update needed:** The document detail endpoint (`GET /api/documents/[id]`) and list endpoint need to also join `larinova_consultations(id, consultation_code)` alongside the existing patient join, so `consultation_code` is available for display. The `consultation_id` FK already exists on `larinova_documents`.

Update the select in both `route.ts` files:
```ts
.select(`
  *,
  patient:larinova_patients(id, full_name, patient_code, date_of_birth, gender),
  doctor:larinova_doctors(id, full_name, specialization, license_number),
  consultation:larinova_consultations(id, consultation_code)
`)
```

Update `DocumentWithPatient` type:
```ts
interface DocumentWithPatient extends HelenaDocument {
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
  consultation?: { id: string; consultation_code: string } | null;
}
```

---

## Save Flow (per-field autosave)

1. User blurs an `EditableField` or `EditableSection`
2. Component calls `onChange(newValue)` 
3. `DocumentPrintPreview` reconstructs full markdown from all sections via `serializeSections()`
4. Calls `onSave({ content: newMarkdown })` → `PATCH /api/documents/[id]`
5. On success: brief `"Saved ✓"` flash in card footer (green, fades after 1.5s)
6. On failure: field reverts to previous value, brief `"Failed to save"` flash (red)

Title saves independently via its own `onSave({ title: newTitle })` call.

---

## Print + PDF Export

The `handlePrint` and `handleDownload` functions in `page.tsx` already work by capturing a `ref`. The `DocumentPrintPreview` component exposes a `printableRef` on the card div. Since the card is already styled like the printed output (white, serif, A4-proportioned), print output matches the preview exactly — no separate HTML template needed (unlike the current approach).

---

## Transcript Documents

`transcript` type documents are **read-only** in the preview:
- Sections render as static `<p>` — no click-to-edit, no dashed underline
- No edit hint shown
- A small `"Read-only"` label appears in the document meta row
- Print/Download still available

---

## What Does NOT Change

- Left sidebar (folder navigation) — unchanged
- Document list panel — unchanged, except add `consultation_code` to the subtitle line when available: `"Dr. Suresh · C-0042 · 3 Apr 2026"`
- Status workflow (draft → finalized → sent) — unchanged, stays in the actions card below the print preview
- Delete functionality — unchanged
- Grid view — unchanged
- Search/filter — unchanged

---

## File Size Check

`documents/page.tsx` is currently 927 lines — above the 300-line limit. The redesign moves the detail panel content into `DocumentPrintPreview.tsx`, which will bring `page.tsx` to ~500 lines. Further split: extract the sidebar into `DocumentsSidebar.tsx` and the list into `DocumentsList.tsx` to get each file under 300 lines.

**Target file breakdown:**
- `page.tsx` — ~200 lines (state, data fetching, layout shell only)
- `DocumentsSidebar.tsx` — ~100 lines
- `DocumentsList.tsx` — ~150 lines  
- `DocumentPrintPreview.tsx` — ~250 lines
- `EditableField.tsx` — ~60 lines
- `EditableSection.tsx` — ~70 lines
- `lib/documents/parse-sections.ts` — ~50 lines
