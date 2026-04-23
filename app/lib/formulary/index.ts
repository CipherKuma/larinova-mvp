import type { Locale } from "@/src/i18n/routing";
import bpomData from "./bpom.json";

export interface FormularyEntry {
  id: string;
  name: string;
  generic: string;
  strength: string;
  form: string;
  category: string;
}

export async function searchFormulary(
  locale: Locale,
  query: string,
): Promise<FormularyEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (locale === "id") {
    return (bpomData as FormularyEntry[]).filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.generic.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }

  // India — delegate to existing medicines search logic
  const { searchIndianMedicines } = await import("./india");
  return searchIndianMedicines(q);
}
