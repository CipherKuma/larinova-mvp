"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "confirmed" | "cancelled" | "completed";

const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://app.larinova.com";

export default function AppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"cancel" | "upload" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onCancel() {
    setBusy("cancel");
    setMsg(null);
    try {
      const res = await fetch(
        `${MAIN_APP_URL}/api/appointments/${appointmentId}/cancel`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) throw new Error(await res.text());
      setMsg("Appointment cancelled.");
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      setMsg(
        e instanceof Error
          ? `Could not cancel: ${e.message}`
          : "Could not cancel appointment.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("upload");
    setMsg(null);
    try {
      const supabase = createClient();
      const path = `${appointmentId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("patient-documents")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      setMsg(`Uploaded ${file.name}.`);
      router.refresh();
    } catch (err) {
      setMsg(
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : "Upload failed. Try again.",
      );
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  if (status !== "confirmed") {
    return (
      <section className="rounded-2xl border border-foreground/8 bg-card/30 p-5 text-sm text-foreground/65">
        This appointment is{" "}
        <span className="font-medium text-foreground/85">{status}</span> — no
        actions available.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-foreground/10 bg-card/45 p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
        Manage
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={`${MAIN_APP_URL}/book/reschedule?appointment=${appointmentId}`}
          className="group flex items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-left transition hover:border-foreground/25 hover:bg-foreground/[0.04]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Reschedule</p>
            <p className="mt-0.5 text-xs text-foreground/55">
              Pick a new slot in the doctor&apos;s schedule.
            </p>
          </div>
        </a>

        <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-left transition hover:border-foreground/25 hover:bg-foreground/[0.04]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
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
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {busy === "upload" ? "Uploading…" : "Upload a document"}
            </p>
            <p className="mt-0.5 text-xs text-foreground/55">
              PDF or image — labs, scans, photos.
            </p>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={onUpload}
              disabled={busy !== null}
              className="sr-only"
            />
          </div>
        </label>
      </div>

      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-9 items-center text-xs font-medium text-red-400/80 transition hover:text-red-400"
        >
          Cancel appointment
        </button>
      ) : (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-4">
          <p className="text-sm text-foreground/85">
            Cancel this appointment? You&apos;ll need to book again.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy !== null}
              className="inline-flex h-9 items-center rounded-lg bg-red-500/90 px-4 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              {busy === "cancel" ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={busy !== null}
              className="inline-flex h-9 items-center rounded-lg border border-foreground/15 px-4 text-sm font-medium text-foreground/80 transition hover:border-foreground/30"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p role="status" className="text-xs text-foreground/70">
          {msg}
        </p>
      )}
    </section>
  );
}
