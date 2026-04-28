"use client";

import Image from "next/image";
import { type Locale, content as localeContent } from "@/data/locale-content";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const c = localeContent[locale].footer;

  return (
    <footer className="relative overflow-hidden border-t border-border pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5 lg:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/larinova-icon.png"
                alt="Larinova"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold text-white tracking-tight">
                Larinova
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              {c.description}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                {c.poweredByText}
              </span>
              {c.provider === "sarvam" ? (
                <Image
                  src="/sarvam-wordmark.svg"
                  alt="Sarvam AI"
                  width={48}
                  height={8}
                  className="h-2 w-auto opacity-70"
                />
              ) : (
                <span className="font-mono text-[11px] font-semibold text-primary/80">
                  Deepgram
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {c.sections.product}
            </h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.features}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.pricing}
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.howItWorks}
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.blog}
                </a>
              </li>
              <li>
                <a
                  href={`/${locale}/discovery-survey`}
                  className="transition-colors hover:text-foreground"
                >
                  {locale === "id" ? "Survei Dokter" : "Doctor Survey"}
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {c.sections.company}
            </h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li>
                <a
                  href="mailto:hello@larinova.com"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.about}
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@larinova.com"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.contact}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="transition-colors hover:text-foreground"
                >
                  {c.links.privacy}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-6 border-t border-border pt-6 sm:flex-row sm:items-center">
          <div className="font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Larinova. {c.copyright}
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {locale === "id"
              ? "Mendengarkan di Indonesia"
              : "Listening across India"}
          </div>
        </div>

        {/* Closing wordmark moment — subtle gradient swash */}
        <div
          aria-hidden
          className="pointer-events-none mt-8 select-none overflow-hidden"
        >
          <div className="font-display text-[14vw] font-bold leading-[0.85] tracking-[-0.04em] text-transparent [background:linear-gradient(180deg,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0.04)_100%)] bg-clip-text">
            Larinova
          </div>
        </div>
      </div>
    </footer>
  );
}
