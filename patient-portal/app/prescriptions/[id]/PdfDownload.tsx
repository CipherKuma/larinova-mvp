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
    <section className="flex flex-col items-start gap-4 rounded-2xl border border-foreground/10 bg-card/45 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
          Take it with you
        </h2>
        <p className="text-sm text-foreground/80">
          Print or save the prescription as a PDF — handy at the pharmacy.
        </p>
      </div>
      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? (
          "Preparing…"
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
