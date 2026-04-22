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
        className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-5 text-base"
      >
        <p className="font-medium">Thank you.</p>
        <p className="mt-1 text-foreground/70">
          Your doctor will review this before your visit.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      aria-label="Intake form"
    >
      {questions.map((q) => (
        <label key={q.key} className="block">
          <span className="text-sm font-medium">{q.label}</span>
          {q.type === "textarea" ? (
            <textarea
              {...register(q.key)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-foreground/15 bg-transparent px-4 py-3 text-base outline-none transition focus:border-foreground/40"
            />
          ) : (
            <input
              type="text"
              {...register(q.key)}
              className="mt-1 block w-full rounded-lg border border-foreground/15 bg-transparent px-4 py-3 text-base outline-none transition focus:border-foreground/40"
            />
          )}
        </label>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-4 text-base font-medium text-background disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit intake"}
      </button>

      {state.kind === "error" && (
        <p role="alert" className="text-sm text-red-500">
          {state.message}
        </p>
      )}
    </form>
  );
}
