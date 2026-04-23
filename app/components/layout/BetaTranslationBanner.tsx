"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";

export default function BetaTranslationBanner() {
  const locale = useLocale();
  const t = useTranslations("Banner");
  const [dismissed, setDismissed] = useState(false);

  if (locale !== "id" || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500/90 px-4 py-2 text-amber-950 text-sm">
      <span className="flex-1 text-center font-medium">
        {t("betaTranslation")}
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label={t("dismiss")}
        className="shrink-0 rounded p-0.5 hover:bg-amber-600/30 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
