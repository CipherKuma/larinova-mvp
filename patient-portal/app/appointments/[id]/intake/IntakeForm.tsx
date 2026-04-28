"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://app.larinova.com";

export type IntakeQuestion = {
  key: string;
  label: string;
  type?: string;
};

export default function IntakeForm({
  appointmentId,
  questions,
}: {
  appointmentId: string;
  questions: IntakeQuestion[];
}) {
  const schema = z.object(
    Object.fromEntries(questions.map((q) => [q.key, z.string().optional()])),
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const [state, setState] = useState<
    { kind: "idle" } | { kind: "done" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch(`${MAIN_APP_URL}/api/intake-submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointment_id: appointmentId,
          answers: values,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState({ kind: "done" });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not submit",
      });
    }
  }

  if (state.kind === "done") {
    return (
      <div
        role="status"
        className="overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.05] p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <p className="font-display text-lg font-semibold">Thank you.</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              Your doctor will read this before you walk in. You can edit your
              answers anytime before the visit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      aria-label="Intake form"
    >
      {questions.map((q, idx) => (
        <div key={q.key} className="space-y-2">
          <label
            htmlFor={`intake-${q.key}`}
            className="flex items-center gap-2 text-sm font-medium text-foreground/85"
          >
            <span className="font-mono text-[10px] tabular-nums tracking-wide text-foreground/40">
              {String(idx + 1).padStart(2, "0")}
            </span>
            {q.label}
          </label>
          {q.type === "textarea" ? (
            <textarea
              id={`intake-${q.key}`}
              {...register(q.key)}
              rows={3}
              placeholder="Type your answer…"
              className="block w-full resize-y rounded-xl border border-foreground/12 bg-card/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <input
              id={`intake-${q.key}`}
              type="text"
              {...register(q.key)}
              placeholder="Type your answer…"
              className="block w-full rounded-xl border border-foreground/12 bg-card/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Submitting…" : "Submit intake"}
        {!isSubmitting && (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="m13 5 7 7-7 7" />
          </svg>
        )}
      </button>

      {state.kind === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
