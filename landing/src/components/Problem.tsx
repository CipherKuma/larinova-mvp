"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { type Locale, content as localeContent } from "@/data/locale-content";

gsap.registerPlugin(ScrollTrigger);

interface ProblemProps {
  locale: Locale;
}

const ACCENT_TOKENS = ["#f59e0b", "#0ea5e9", "#a855f7"];

export function Problem({ locale }: ProblemProps) {
  const c = localeContent[locale].problem;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = sectionRef.current?.querySelectorAll(".stat-item");
        if (!items) return;
        items.forEach((item, i) => {
          const num = item.querySelector(".stat-num");
          const label = item.querySelector(".stat-label");
          const rule = item.querySelector(".stat-rule");
          const tl = gsap.timeline({
            defaults: { immediateRender: false },
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              toggleActions: "play none none none",
            },
            delay: i * 0.12,
          });
          if (rule)
            tl.from(rule, {
              scaleX: 0,
              transformOrigin: "left",
              duration: 0.55,
              ease: "power3.out",
            });
          if (num)
            tl.from(
              num,
              { opacity: 0, y: 36, duration: 0.7, ease: "power3.out" },
              "-=0.35",
            );
          if (label)
            tl.from(
              label,
              { opacity: 0, y: 12, duration: 0.45, ease: "power3.out" },
              "-=0.45",
            );
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background py-24 sm:py-28 md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.07) 0%, transparent 55%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <h2 className="mb-20 max-w-3xl text-balance font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          {c.headline} <span className="text-gradient">{c.headlineAccent}</span>{" "}
          {c.headlinePost}
        </h2>

        <dl className="grid gap-y-14 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-0">
          {c.stats.map((stat, i) => {
            const accent = ACCENT_TOKENS[i] ?? ACCENT_TOKENS[0];
            return (
              <div key={stat.value} className="stat-item">
                <div
                  className="stat-rule mb-6 h-px w-16 origin-left"
                  style={{ backgroundColor: accent }}
                />
                <dd
                  className="stat-num font-display text-[clamp(3.5rem,8vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.04em] text-foreground"
                  style={{ color: accent }}
                >
                  {stat.value}
                </dd>
                <dt className="stat-label mt-5 max-w-[22ch] min-h-[3.5rem] text-base leading-relaxed text-foreground/75 sm:text-lg">
                  {stat.label}
                </dt>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
