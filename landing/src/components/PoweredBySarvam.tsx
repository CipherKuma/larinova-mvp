"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { type Locale, content as localeContent } from "@/data/locale-content";

gsap.registerPlugin(ScrollTrigger);

interface PoweredBySarvamProps {
  locale: Locale;
}

export function PoweredBySarvam({ locale }: PoweredBySarvamProps) {
  const c = localeContent[locale].poweredBy;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = sectionRef.current?.querySelectorAll(".sarvam-fade");
        if (!targets || !targets.length) return;
        gsap.from(targets, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative bg-background py-28 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.07) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <span className="sarvam-fade mb-5 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          {c.sectionLabel}
        </span>
        <div className="sarvam-fade mb-7 flex justify-center">
          {c.provider === "sarvam" ? (
            <Image
              src="/sarvam-logo-white.svg"
              alt="Sarvam AI"
              width={40}
              height={40}
              className="h-10 w-10 opacity-60"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="font-mono text-xs font-bold text-primary">
                DG
              </span>
            </div>
          )}
        </div>
        <h2 className="sarvam-fade mx-auto mb-6 max-w-4xl text-balance font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          {c.headlinePre}
          <br />
          <span className="text-gradient">{c.headlineAccent}</span>
        </h2>
        <p className="sarvam-fade mx-auto mb-14 max-w-2xl text-lg leading-relaxed text-foreground/75">
          {c.description}
        </p>

        <div className="sarvam-fade mb-14 flex flex-wrap justify-center gap-2">
          {c.languages.map((lang) => (
            <span
              key={lang}
              className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                lang === c.highlightLanguage
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {lang}
            </span>
          ))}
          <span className="rounded-full border border-border px-4 py-1.5 font-mono text-xs text-muted-foreground">
            {c.moreCount}
          </span>
        </div>

        <div className="sarvam-fade mx-auto grid max-w-3xl gap-x-10 gap-y-6 sm:grid-cols-3">
          {c.stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center"
            >
              <div className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {s.val}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
