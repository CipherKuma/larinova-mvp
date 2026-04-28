"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { type Locale, content as localeContent } from "@/data/locale-content";
import { PhaseVisualBook } from "./features-india/PhaseVisualBook";
import { PhaseVisualIntake } from "./features-india/PhaseVisualIntake";
import { PhaseVisualPrep } from "./features-india/PhaseVisualPrep";
import { PhaseVisualConsult } from "./features-india/PhaseVisualConsult";
import { PhaseVisualFollowUp } from "./features-india/PhaseVisualFollowUp";

gsap.registerPlugin(ScrollTrigger);

const VISUALS = [
  PhaseVisualBook,
  PhaseVisualIntake,
  PhaseVisualPrep,
  PhaseVisualConsult,
  PhaseVisualFollowUp,
];

interface FeaturesIndiaProps {
  locale: Locale;
}

export function FeaturesIndia({ locale }: FeaturesIndiaProps) {
  const opd = localeContent[locale].opd;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!opd) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rows = sectionRef.current?.querySelectorAll(".phase-row");
        if (!rows) return;
        rows.forEach((row) => {
          const line = row.querySelector(".phase-line");
          const num = row.querySelector(".phase-num");
          const label = row.querySelector(".phase-label");
          const verb = row.querySelector(".phase-verb");
          const noun = row.querySelector(".phase-noun");
          const desc = row.querySelector(".phase-desc");
          const visual = row.querySelector(".phase-visual");

          const tl = gsap.timeline({
            defaults: { immediateRender: false },
            scrollTrigger: {
              trigger: row,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
          if (line)
            tl.from(line, {
              scaleX: 0,
              transformOrigin: "left",
              duration: 0.6,
              ease: "power3.out",
            });
          if (num) tl.from(num, { opacity: 0, y: 12, duration: 0.4 }, "-=0.3");
          if (label)
            tl.from(label, { opacity: 0, y: 12, duration: 0.4 }, "-=0.3");
          if (verb)
            tl.from(verb, { opacity: 0, y: 28, duration: 0.7 }, "-=0.2");
          if (noun)
            tl.from(noun, { opacity: 0, y: 28, duration: 0.7 }, "-=0.5");
          if (desc)
            tl.from(desc, { opacity: 0, y: 16, duration: 0.5 }, "-=0.4");
          if (visual)
            tl.from(
              visual,
              { opacity: 0, y: 32, scale: 0.97, duration: 0.8 },
              "-=0.6",
            );
        });
      });
    },
    { scope: sectionRef, dependencies: [opd] },
  );

  if (!opd) return null;
  const { features } = opd;

  return (
    <section ref={sectionRef} id="opd-journey" className="relative">
      {/* Section intro */}
      <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-12 text-center sm:pt-28 sm:pb-16">
        <span className="mb-5 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          {features.sectionLabel}
        </span>
        <h2 className="text-balance font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-[4rem]">
          {features.headlinePre}
          <br />
          <span className="text-gradient">{features.headlineAccent}</span>
        </h2>
      </div>

      {/* Phases — one viewport each, alternating */}
      <div>
        {features.phases.map((phase, i) => {
          const Visual = VISUALS[i] ?? VISUALS[VISUALS.length - 1];
          const reversed = i % 2 !== 0;
          return (
            <div
              key={phase.num}
              className="phase-row relative flex items-center px-6 py-20 sm:py-24 lg:min-h-[80vh] lg:py-28"
            >
              <div
                className={`mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:gap-20 ${
                  reversed ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                {/* Text column */}
                <div className="flex-1 space-y-5 lg:max-w-xl">
                  <div
                    className="phase-line h-[2px] w-24 origin-left"
                    style={{ backgroundColor: phase.accent }}
                  />
                  <div className="flex items-center gap-3">
                    <span
                      className="phase-num font-mono text-sm font-bold"
                      style={{ color: phase.accent }}
                    >
                      {phase.num}
                    </span>
                    <span className="phase-label font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      {phase.label}
                    </span>
                  </div>
                  <h3 className="max-w-[18ch] font-display text-3xl font-bold leading-[1.02] tracking-[-0.015em] text-foreground sm:text-4xl md:text-5xl lg:text-[3.4rem]">
                    <span className="phase-verb block">{phase.verb}</span>
                    <span
                      className="phase-noun block"
                      style={{ color: phase.accent }}
                    >
                      {phase.noun}
                    </span>
                  </h3>
                  <p className="phase-desc max-w-lg text-base leading-relaxed text-foreground/75 sm:text-lg">
                    {phase.desc}
                  </p>
                </div>

                {/* Visual column */}
                <div className="phase-visual flex flex-1 justify-center lg:max-w-xl">
                  <Visual />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
