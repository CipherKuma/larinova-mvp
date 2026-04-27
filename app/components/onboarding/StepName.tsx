"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface StepNameProps {
  onContinue: (firstName: string, lastName: string) => void;
}

export function StepName({ onContinue }: StepNameProps) {
  const t = useTranslations("onboarding.nameStep");
  const tc = useTranslations("common");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHydrated(true);
        return;
      }
      // Prefer the doctor row (it's the source of truth once set), fall
      // back to auth metadata for first-time users coming from sign-up.
      const { data: doctor } = await supabase
        .from("larinova_doctors")
        .select("first_name, last_name, full_name")
        .eq("user_id", user.id)
        .single();

      let f = doctor?.first_name ?? "";
      let l = doctor?.last_name ?? "";
      if (!f && !l) {
        const meta = user.user_metadata?.full_name as string | undefined;
        if (meta) {
          const parts = meta.trim().split(/\s+/);
          f = parts[0] ?? "";
          l = parts.slice(1).join(" ");
        }
      }
      setFirstName(f);
      setLastName(l);
      setHydrated(true);
    })();
  }, []);

  const canContinue =
    firstName.trim().length >= 1 && lastName.trim().length >= 1 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    setSaving(true);
    setError(null);

    const fn = firstName.trim();
    const ln = lastName.trim();
    const fullName = `${fn} ${ln}`;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t("errorNotSignedIn"));
        setSaving(false);
        return;
      }

      // Persist on the doctor row. The trigger keeps full_name synced.
      const { error: updErr } = await supabase
        .from("larinova_doctors")
        .update({ first_name: fn, last_name: ln })
        .eq("user_id", user.id);

      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }

      // Also keep auth metadata's full_name fresh — anything reading it
      // (greetings, prescription PDFs, email templates) gets the right
      // value from now on.
      await supabase.auth.updateUser({ data: { full_name: fullName } });

      onContinue(fn, ln);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-shrink-0 pt-4 pb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("title")}
        </h2>
        <p className="font-display text-foreground/50 tracking-wide">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first-name" className="text-sm font-medium">
              {t("firstName")}
            </Label>
            <Input
              id="first-name"
              name="first-name"
              autoComplete="given-name"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("firstName")}
              maxLength={60}
              disabled={!hydrated || saving}
              className="min-h-[48px] text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last-name" className="text-sm font-medium">
              {t("lastName")}
            </Label>
            <Input
              id="last-name"
              name="last-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("lastName")}
              maxLength={60}
              disabled={!hydrated || saving}
              className="min-h-[48px] text-base"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("usedOnDocuments")}</p>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 pt-4">
        <Button
          type="submit"
          disabled={!canContinue}
          className="w-full min-h-[48px]"
        >
          {saving ? "…" : tc("continue")}
        </Button>
      </div>
    </form>
  );
}
