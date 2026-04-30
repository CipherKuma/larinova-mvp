"use client";

import { type Locale, content as localeContent } from "@/data/locale-content";
import { DeferredVideo } from "./DeferredVideo";

interface HeroIndiaProps {
  locale: Locale;
}

export function HeroIndia({ locale }: HeroIndiaProps) {
  const opd = localeContent[locale].opd;

  if (!opd) return null;
  const { hero } = opd;

  return (
    <section className="relative flex min-h-[calc(100svh)] items-center justify-center overflow-hidden pt-24 pb-16 lg:min-h-screen">
      {/* Animated radial gradient glow — breathes behind headline */}
      <div
        aria-hidden
        className="hero-glow-pulse pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "1100px",
          height: "1100px",
          background:
            "radial-gradient(circle at center, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.08) 28%, transparent 60%)",
          opacity: 0.55,
        }}
      />

      {/* Grid lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="max-w-[14ch] font-display text-[2rem] font-bold leading-[1.02] tracking-[-0.025em] text-balance text-foreground sm:max-w-[22ch] sm:text-[3.25rem] md:max-w-[26ch] md:text-[3.75rem] lg:max-w-none lg:text-[4rem] xl:text-[4.5rem]">
            {hero.headline.split(" ").map((word, i) => (
              <span
                key={i}
                className="hero-rise inline-block"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {word}
                {i < hero.headline.split(" ").length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p
            className="hero-rise mt-6 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg md:text-xl"
            style={{ animationDelay: "460ms" }}
          >
            {hero.sub}
          </p>

          <div
            className="hero-rise mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center lg:justify-start"
            style={{ animationDelay: "600ms" }}
          >
            <a
              href={hero.ctaPrimaryHref}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-18px_rgba(16,185,129,0.45)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>{hero.ctaPrimary}</span>
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
            <a
              href={hero.ctaSecondaryHref}
              className="group inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-4 text-sm font-semibold text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="relative">
                {hero.ctaSecondary}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-foreground/40 transition-transform duration-300 group-hover:scale-x-100" />
              </span>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 10h10" />
                <path d="m11 5 5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right column: cinematic hero loop (Higgsfield + Kling) */}
        <div
          className="hero-rise flex w-full flex-1 flex-col items-center lg:items-end lg:justify-end"
          style={{ animationDelay: "720ms" }}
          data-slot="hero-loop"
        >
          <div className="relative aspect-video w-full max-w-[320px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_30px_80px_-20px_rgba(16,185,129,0.35)] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[640px] xl:max-w-[700px]">
            <DeferredVideo
              src="/videos/hero-loop.mp4"
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Larinova product loop"
            />
            {/* Subtle inner ring */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
