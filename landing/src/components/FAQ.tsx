"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/data/faqs";
import { FAQS_ID } from "@/data/faqs-id";
import { type Locale, content as localeContent } from "@/data/locale-content";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group/faq relative border-b border-white/[0.06]">
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-primary transition-transform duration-300 ${
          open ? "scale-y-100" : ""
        }`}
      />
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="group flex w-full items-start justify-between gap-6 py-5 pl-3 pr-1 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          className={`text-base font-medium leading-snug transition-colors sm:text-[15px] ${
            open
              ? "text-foreground"
              : "text-foreground/85 group-hover:text-foreground"
          }`}
        >
          {q}
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 flex-shrink-0 text-foreground/55 transition-transform duration-300 group-hover:text-foreground/85 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      <div
        className={`grid overflow-hidden pl-3 pr-1 transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <p className="min-h-0 pb-5 text-[15px] leading-relaxed text-foreground/70">
          {a}
        </p>
      </div>
    </div>
  );
}

interface FAQProps {
  locale: Locale;
}

export function FAQ({ locale }: FAQProps) {
  const c = localeContent[locale].faq;
  const faqs = locale === "id" ? FAQS_ID : FAQS;

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            {c.sectionLabel}
          </span>
          <h2 className="text-balance font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
            {c.headline}
          </h2>
        </div>
        <div className="border-t border-white/[0.06]">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
