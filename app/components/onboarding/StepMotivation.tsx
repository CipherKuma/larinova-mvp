"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, ClipboardList, FileText, Brain } from "lucide-react";
import { OnboardingCard } from "./OnboardingCard";
import { useTranslations } from "next-intl";

interface StepMotivationProps {
  onContinue: () => void;
}

export function StepMotivation({ onContinue }: StepMotivationProps) {
  const t = useTranslations("onboarding.motivationStep");
  const tc = useTranslations("common");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const painPoints = [
    { id: 0, text: t("pain0"), featured: true, icon: Languages },
    { id: 1, text: t("pain1"), featured: false, icon: ClipboardList },
    { id: 2, text: t("pain2"), featured: false, icon: FileText },
    { id: 3, text: t("pain3"), featured: false, icon: Brain },
  ];

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — pinned */}
      <div className="flex-shrink-0 pt-4 pb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("title")}
        </h2>
        <p className="font-display text-foreground/50 tracking-wide">
          {t("subtitle")}
        </p>
      </div>

      {/* Content — fills available space, scrollable if overflow */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full auto-rows-fr">
          {painPoints.map((point) => {
            const Icon = point.icon;
            return (
              <OnboardingCard
                key={point.id}
                selected={selected.has(point.id)}
                onClick={() => toggle(point.id)}
                featured={point.featured}
                index={point.id}
                className="h-full"
              >
                <div className="flex flex-col gap-3 h-full">
                  <Icon className="w-8 h-8 text-primary shrink-0" />
                  <p className="text-lg text-foreground leading-snug">
                    {point.text}
                  </p>
                </div>
              </OnboardingCard>
            );
          })}
        </div>
      </div>

      {/* Actions — pinned bottom */}
      <div className="flex-shrink-0 pt-6 pb-4">
        <Button
          onClick={onContinue}
          disabled={selected.size === 0}
          className="w-full"
          size="lg"
        >
          {tc("continue")}
        </Button>
      </div>
    </div>
  );
}
