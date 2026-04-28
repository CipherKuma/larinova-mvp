"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
// itshover registry returns 404 for menu/x/chevron/arrow/check (verified 2026-04-28); lucide is the documented fallback per ui-rules.
import Image from "next/image";
import { type Locale, content as localeContent } from "@/data/locale-content";

interface NavProps {
  locale: Locale;
}

export function Nav({ locale }: NavProps) {
  const c = localeContent[locale].nav;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Map display labels to href targets
  const linkHrefs: Record<string, string> = {
    Features: "#features",
    Fitur: "#features",
    Pricing: "#pricing",
    Harga: "#pricing",
    Blog: "/blog",
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || open ? "rgba(10, 15, 30, 0.95)" : "transparent",
        backdropFilter: scrolled || open ? "blur(16px)" : "none",
        borderBottom:
          scrolled || open
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href={`/${locale}`}>
          <div className="flex items-center gap-2.5">
            <Image
              src="/larinova-icon.png"
              alt="Larinova"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              Larinova
            </span>
          </div>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {c.links.map((link) => (
            <a
              key={link}
              href={linkHrefs[link] ?? `#${link.toLowerCase()}`}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Locale switcher — desktop */}
          <div className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5 md:flex">
            {(
              [
                { l: "in", flag: "🇮🇳", code: "IN" },
                { l: "id", flag: "🇮🇩", code: "ID" },
              ] as const
            ).map(({ l, flag, code }) =>
              l === locale ? (
                <span
                  key={l}
                  className="rounded-full bg-primary/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary"
                >
                  {flag} {code}
                </span>
              ) : (
                <a
                  key={l}
                  href={`/${l}`}
                  className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  {flag} {code}
                </a>
              ),
            )}
          </div>

          <a
            href={`/${locale}/discovery-survey`}
            className="group hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
          >
            <span>{c.cta}</span>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5"
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
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {c.links.map((link) => (
              <a
                key={link}
                href={linkHrefs[link] ?? `#${link.toLowerCase()}`}
                onClick={() => setOpen(false)}
                className="py-2 font-mono text-base uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {link}
              </a>
            ))}

            {/* Locale switcher — mobile */}
            <div className="flex items-center gap-0.5 self-start rounded-full border border-white/10 bg-white/5 p-0.5">
              {(
                [
                  { l: "in", flag: "🇮🇳", code: "IN" },
                  { l: "id", flag: "🇮🇩", code: "ID" },
                ] as const
              ).map(({ l, flag, code }) =>
                l === locale ? (
                  <span
                    key={l}
                    className="rounded-full bg-primary/20 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-primary"
                  >
                    {flag} {code}
                  </span>
                ) : (
                  <a
                    key={l}
                    href={`/${l}`}
                    className="rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {flag} {code}
                  </a>
                ),
              )}
            </div>

            <a
              href={`/${locale}/discovery-survey`}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              {c.cta}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
