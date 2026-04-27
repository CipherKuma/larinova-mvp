"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "sent" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setState({ kind: "submitting" });

    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    setState({ kind: "sent" });
  }

  if (state.kind === "sent") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 text-base"
      >
        <p className="font-medium text-primary">Check your email.</p>
        <p className="mt-1 text-foreground/75">
          We sent a magic link to <span className="font-medium">{email}</span>.
          Tap it on this device to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-foreground/80">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          autoFocus
          className="mt-2 block w-full rounded-xl border border-border bg-card/60 px-4 py-3.5 text-base placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)] transition hover:brightness-110 disabled:opacity-60"
      >
        {state.kind === "submitting" ? "Sending…" : "Send magic link"}
      </button>

      {state.kind === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <p className="pt-2 text-xs leading-relaxed text-foreground/55">
        New here? Your doctor booked your appointment — use the same email they
        have on file.
      </p>
    </form>
  );
}
