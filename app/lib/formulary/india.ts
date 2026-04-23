import { createClient } from "@/lib/supabase/server";
import type { FormularyEntry } from "./index";

export async function searchIndianMedicines(
  query: string,
): Promise<FormularyEntry[]> {
  if (!query.trim()) return [];

  const supabase = await createClient();

  const { data: medicines, error } = await supabase
    .from("larinova_medicines")
    .select("id, name, generic_name, category, common_dosages")
    .or(`name.ilike.%${query}%,generic_name.ilike.%${query}%`)
    .eq("is_active", true)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (medicines ?? []).map((m) => ({
    id: String(m.id),
    name: m.name ?? "",
    generic: m.generic_name ?? "",
    strength:
      Array.isArray(m.common_dosages) && m.common_dosages.length > 0
        ? String(m.common_dosages[0])
        : "",
    form: "",
    category: m.category ?? "",
  }));
}
