"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sharedAsset } from "@/lib/locale-asset";

type ApiError = "invalid_or_used_code" | "invalid_input" | "unknown";

export function AccessForm({ locale }: { locale: string }) {
  const t = useTranslations("access");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorMessage(e: ApiError): string {
    switch (e) {
      case "invalid_or_used_code":
        return t("errorInvalid");
      case "invalid_input":
        return t("errorMalformed");
      default:
        return t("errorUnknown");
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
      router.push(`/${locale}/sign-up`);
    } catch {
      setError("unknown");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <Image
            src={sharedAsset("larinova-icon.png")}
            alt="Larinova"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Larinova
          </span>
        </div>
      </div>

      <div className="w-16 h-px bg-muted-foreground/30 mx-auto" />

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-code">{t("label")}</Label>
        <Input
          id="invite-code"
          name="invite-code"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={t("placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={submitting}
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage(error)}
          </p>
        )}
      </div>

      <Button type="submit" disabled={submitting || code.trim().length < 6}>
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
