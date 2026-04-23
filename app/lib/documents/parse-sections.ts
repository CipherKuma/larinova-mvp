export interface Section {
  title: string; // e.g. "Subjective" — empty string for untitled preamble blocks
  body: string; // plain text, no markdown syntax
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
