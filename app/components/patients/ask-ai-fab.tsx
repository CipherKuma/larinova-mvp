"use client";

import { useRouter } from "@/src/i18n/routing";
import { Sparkles } from "lucide-react";

/**
 * Floating action button on the patient detail page. Scopes the existing
 * assistant chat to a specific patient via `?patient=<id>` query param.
 */
export function AskAIFab({ patientId }: { patientId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/?ask=${patientId}`)}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
      aria-label="Ask AI about this patient"
    >
      <Sparkles className="h-4 w-4" />
      Ask AI about this patient
    </button>
  );
}
