"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sharedAsset } from "@/lib/locale-asset";

type ApiError = "invalid_or_used_code" | "invalid_input" | "unknown";

export function AccessForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorMessage(e: ApiError): string {
    switch (e) {
      case "invalid_or_used_code":
        return "That code isn't valid or has already been used.";
      case "invalid_input":
        return "Please enter a valid invite code.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        setError((body?.error as ApiError) ?? "unknown");
        setSubmitting(false);
        return;
      }
      router.push(`/${locale}/sign-in`);
    } catch {
      setError("unknown");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-2">
          <Image
            src={sharedAsset("larinova-icon.png")}
            alt="Larinova"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="font-display font-semibold text-foreground tracking-tight text-2xl">
            Larinova
          </span>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Enter your invite code
        </h1>
        <p className="text-sm text-muted-foreground">
          Larinova is invite-only during the alpha. Paste the code we emailed
          you to continue.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-code" className="text-sm font-medium">
          Invite code
        </Label>
        <Input
          id="invite-code"
          name="invite-code"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="characters"
          placeholder="LARI-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={submitting}
          className="min-h-[48px] text-base tracking-wider font-mono"
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage(error)}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting || code.trim().length < 6}
        className="min-h-[48px]"
      >
        {submitting ? "Checking…" : "Continue"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Don&apos;t have a code? Request access at{" "}
        <a
          href="https://larinova.com/in"
          className="text-primary hover:underline"
        >
          larinova.com
        </a>
      </p>
    </form>
  );
}
