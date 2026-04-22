"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://app.larinova.com";

export default function PdfDownload({
  prescriptionId,
}: {
  prescriptionId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `prescriptions/${prescriptionId}.pdf`;
      const { data, error: signErr } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(path, 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        return;
      }
      // Fallback: main app PDF export endpoint
      if (signErr) {
        window.open(
          `${MAIN_APP_URL}/api/prescriptions/${prescriptionId}/pdf`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not generate PDF. Try again shortly.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-foreground/10 p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        Download
      </h2>
      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        className="inline-flex h-11 items-center rounded-lg bg-foreground px-5 text-sm font-medium text-background disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Download PDF"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </section>
  );
}
