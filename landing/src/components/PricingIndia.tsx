"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { type Locale, content as localeContent } from "@/data/locale-content";
import { RazorpayCheckoutButton } from "./RazorpayCheckoutButton";

gsap.registerPlugin(ScrollTrigger);

type Interval = "month" | "year";

interface PricingIndiaProps {
  locale: Locale;
}

export function PricingIndia({ locale }: PricingIndiaProps) {
  const opd = localeContent[locale].opd;
  const sectionRef = useRef<HTMLElement>(null);
  const [interval, setInterval] = useState<Interval>("month");

  useGSAP(
    () => {
      if (!opd) return;
      const cards = sectionRef.current?.querySelectorAll(".pricing-card");
      if (!cards) return;
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    },
    { scope: sectionRef, dependencies: [opd] },
  );

  if (!opd) return null;
  const { pricing } = opd;
  const isYearly = interval === "year";

  return (
    <section ref={sectionRef} id="pricing" className="relative py-28 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block font-mono text-xs uppercase tracking-widest text-primary">
            {pricing.sectionLabel}
          </span>
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
            {pricing.headlinePre}{" "}
            <span className="text-gradient">{pricing.headlineAccent}</span>
          </h2>
        </div>

        {/* Billing toggle */}
        <div className="mb-12 flex justify-center">
          <div
            role="tablist"
            aria-label="Billing interval"
            className="inline-flex items-center rounded-full border border-border bg-card/50 p-1"
          >
            <button
              role="tab"
              aria-selected={!isYearly}
              onClick={() => setInterval("month")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                !isYearly
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pricing.monthlyLabel}
            </button>
            <button
              role="tab"
              aria-selected={isYearly}
              onClick={() => setInterval("year")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                isYearly
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pricing.yearlyLabel}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                  isYearly
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {pricing.savingsPill}
              </span>
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="pricing-card rounded-2xl border border-border bg-card/50 p-8">
            <h3 className="mb-2 font-display text-xl font-bold text-foreground">
              {pricing.free.name}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {pricing.free.subtitle}
            </p>
            <div className="mb-6">
              <span className="font-display text-4xl font-bold text-foreground">
                {isYearly
                  ? pricing.free.priceYearly
                  : pricing.free.priceMonthly}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                {isYearly
                  ? pricing.free.periodYearly
                  : pricing.free.periodMonthly}
              </span>
            </div>
            <ul className="mb-8 space-y-3 text-sm text-muted-foreground">
              {pricing.free.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={pricing.free.ctaHref}
              className="block w-full rounded-full border border-border py-3 text-center text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:text-primary"
            >
              {pricing.free.cta}
            </a>
          </div>

          {/* Pro */}
          <div className="pricing-card relative rounded-2xl border border-primary/40 bg-card/60 p-8 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.35)]">
            {pricing.pro.badge && (
              <div className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                {pricing.pro.badge}
              </div>
            )}
            <h3 className="mb-2 font-display text-xl font-bold text-foreground">
              {pricing.pro.name}
            </h3>
            <p className="mb-6 text-sm text-primary">{pricing.pro.subtitle}</p>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-foreground">
                {isYearly ? pricing.pro.priceYearly : pricing.pro.priceMonthly}
              </span>
              <span className="text-sm text-muted-foreground">
                {isYearly
                  ? pricing.pro.periodYearly
                  : pricing.pro.periodMonthly}
              </span>
              {isYearly && pricing.pro.savingsBadge && (
                <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                  {pricing.pro.savingsBadge}
                </span>
              )}
            </div>
            <ul className="mb-8 space-y-3 text-sm text-muted-foreground">
              {pricing.pro.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <RazorpayCheckoutButton
              interval={interval}
              label={pricing.pro.cta}
            />
          </div>
        </div>

        {/* Enterprise strip */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card/30 px-6 py-5 sm:flex-row sm:text-left">
          <div>
            <div className="font-display text-base font-semibold text-foreground">
              {pricing.enterpriseLabel}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {pricing.enterpriseSub}
            </div>
          </div>
          <a
            href={pricing.enterpriseHref}
            className="shrink-0 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
          >
            {pricing.enterpriseCta}
          </a>
        </div>
      </div>
    </section>
  );
}
