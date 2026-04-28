"use client";

import { useEffect, useState } from "react";
import { type Locale, content as localeContent } from "@/data/locale-content";

interface MobileCTAProps {
  locale: Locale;
}

export function MobileCTA({ locale }: MobileCTAProps) {
  const cta = localeContent[locale].mobileCta;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-background/95 px-4 pt-3 backdrop-blur-lg transition-all duration-300 sm:hidden motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <a
        href={`/${locale}/discovery-survey`}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_32px_-12px_rgba(16,185,129,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span>{cta}</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="h-4 w-4"
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
    </div>
  );
}
