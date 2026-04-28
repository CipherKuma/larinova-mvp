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
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = sectionRef.current?.querySelectorAll(".pricing-card");
        if (!cards) return;
        cards.forEach((card, i) => {
          gsap.from(card, {
            opacity: 0,
            y: 32,
            duration: 0.7,
            delay: i * 0.12,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });
      });
    },
    { scope: sectionRef, dependencies: [opd] },
  );

  if (!opd) return null;
  const { pricing } = opd;
  const isYearly = interval === "year";

  return (
    <section ref={sectionRef} id="pricing" className="relative py-28 sm:py-32">
      <div className="mx-auto max-w-6xl overflow-hidden px-6">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <span className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            {pricing.sectionLabel}
          </span>
          <h2 className="mx-auto max-w-[12ch] text-balance font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-foreground sm:max-w-none sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
            <span className="inline-block">{pricing.headlinePre}</span>{" "}
            <span className="inline-block text-gradient">
              {pricing.headlineAccent}
            </span>
          </h2>
        </div>

        {/* Billing toggle — sliding pill segmented control */}
        <div className="mb-14 flex justify-center">
          <div
            role="tablist"
            aria-label="Billing interval"
            className="relative inline-grid w-full max-w-[22rem] grid-cols-2 items-center rounded-full border border-border bg-card/50 p-1 sm:max-w-[34rem]"
          >
            <span
              aria-hidden
              className={`absolute top-1 bottom-1 left-1 rounded-full bg-primary shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
                isYearly ? "translate-x-full" : "translate-x-0"
              }`}
              style={{ width: "calc(50% - 0.25rem)" }}
            />
            <button
              role="tab"
              type="button"
              aria-selected={!isYearly}
              onClick={() => setInterval("month")}
              className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 ${
                !isYearly
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pricing.monthlyLabel}
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={isYearly}
              onClick={() => setInterval("year")}
              className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 ${
                isYearly
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pricing.yearlyLabel}
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
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
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
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
              className="block w-full rounded-full border border-border py-3 text-center text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="shrink-0 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {pricing.enterpriseCta}
          </a>
        </div>
      </div>
    </section>
  );
}
