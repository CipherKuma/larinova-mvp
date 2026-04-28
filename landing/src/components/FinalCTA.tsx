"use client";

import { type Locale, content as localeContent } from "@/data/locale-content";

interface FinalCTAProps {
  locale: Locale;
}

export function FinalCTA({ locale }: FinalCTAProps) {
  const c = localeContent[locale].finalCta;

  return (
    <section className="relative overflow-hidden bg-background py-28 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.16) 0%, transparent 55%), radial-gradient(circle at 20% 20%, rgba(14,165,233,0.08) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(168,85,247,0.07) 0%, transparent 40%)",
        }}
      />
      {/* Faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 75%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          {locale === "id" ? "Mulai uji coba bebas" : "Start your free trial"}
        </span>
        <h2 className="mb-6 text-balance font-display text-4xl font-bold leading-[1.02] tracking-[-0.025em] text-foreground sm:text-5xl md:text-6xl lg:text-[4.25rem]">
          {c.headline}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-foreground/75">
          {c.body}
        </p>
        <a
          href={`/${locale}/discovery-survey`}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-[0_24px_60px_-20px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span>{c.cta}</span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10h12" />
            <path d="m12 4 6 6-6 6" />
          </svg>
        </a>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {c.note}
        </p>
      </div>
    </section>
  );
}
