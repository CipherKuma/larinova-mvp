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
        className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-5 text-base"
      >
        <p className="font-medium">Check your email.</p>
        <p className="mt-1 text-foreground/70">
          We sent a magic link to <span className="font-medium">{email}</span>.
          Tap it on this device to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          autoFocus
          className="mt-1 block w-full rounded-lg border border-foreground/15 bg-transparent px-4 py-3 text-base outline-none transition focus:border-foreground/40"
        />
      </label>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-4 text-base font-medium text-background transition disabled:opacity-60"
      >
        {state.kind === "submitting" ? "Sending…" : "Send magic link"}
      </button>

      {state.kind === "error" && (
        <p role="alert" className="text-sm text-red-500">
          {state.message}
        </p>
      )}

      <p className="text-xs text-foreground/60">
        New to Larinova? Your doctor booked your appointment — use the same
        email they have on file.
      </p>
    </form>
  );
}
