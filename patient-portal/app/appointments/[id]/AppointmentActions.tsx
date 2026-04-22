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

  async function onCancel() {
    if (!confirm("Cancel this appointment? You'll need to book again.")) return;
    setBusy("cancel");
    setMsg(null);
    try {
      const res = await fetch(
        `${MAIN_APP_URL}/api/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setMsg("Appointment cancelled.");
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
      setMsg(`Uploaded ${file.name}`);
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
      <section className="rounded-2xl border border-foreground/10 p-5">
        <p className="text-sm text-foreground/70">
          No actions available — this appointment is {status}.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        Actions
      </h2>

      <a
        href={`${MAIN_APP_URL}/book/reschedule?appointment=${appointmentId}`}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-foreground px-5 text-sm font-medium text-background"
      >
        Reschedule
      </a>

      <label className="block">
        <span className="block text-sm font-medium">
          Upload a document (PDF, image)
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={onUpload}
          disabled={busy !== null}
          className="mt-2 block w-full rounded-lg border border-foreground/15 bg-transparent p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground/10 file:px-3 file:py-1 file:text-sm"
        />
      </label>

      <button
        type="button"
        onClick={onCancel}
        disabled={busy !== null}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-red-500/40 px-5 text-sm font-medium text-red-500 disabled:opacity-60"
      >
        {busy === "cancel" ? "Cancelling…" : "Cancel appointment"}
      </button>

      {msg && (
        <p role="status" className="text-sm text-foreground/80">
          {msg}
        </p>
      )}
    </section>
  );
}
