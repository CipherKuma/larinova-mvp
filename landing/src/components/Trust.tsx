"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  type Locale,
  type TrustItem,
  content as localeContent,
} from "@/data/locale-content";

gsap.registerPlugin(ScrollTrigger);

interface TrustProps {
  locale: Locale;
}

export function Trust({ locale }: TrustProps) {
  const c = localeContent[locale].trust;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rows = sectionRef.current?.querySelectorAll(".trust-row");
        if (!rows) return;
        rows.forEach((row) => {
          const line = row.querySelector(".trust-line");
          const num = row.querySelector(".trust-num");
          const label = row.querySelector(".trust-label");
          const verb = row.querySelector(".trust-verb");
          const noun = row.querySelector(".trust-noun");
          const desc = row.querySelector(".trust-desc");
          const visual = row.querySelector(".trust-visual");
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
              duration: 0.5,
              ease: "power3.out",
            });
          if (num)
            tl.from(num, { opacity: 0, y: 10, duration: 0.35 }, "-=0.25");
          if (label)
            tl.from(label, { opacity: 0, y: 10, duration: 0.35 }, "-=0.25");
          if (verb)
            tl.from(verb, { opacity: 0, y: 22, duration: 0.55 }, "-=0.15");
          if (noun)
            tl.from(noun, { opacity: 0, y: 22, duration: 0.55 }, "-=0.4");
          if (desc)
            tl.from(desc, { opacity: 0, y: 14, duration: 0.45 }, "-=0.35");
          if (visual)
            tl.from(
              visual,
              { opacity: 0, y: 26, scale: 0.97, duration: 0.7 },
              "-=0.5",
            );
        });
      });
    },
    { scope: sectionRef, dependencies: [c] },
  );

  return (
    <section ref={sectionRef} id="trust" className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.08) 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-4 sm:pt-28">
        <div className="flex max-w-3xl flex-col gap-4">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            <span aria-hidden className="h-px w-8 bg-primary/60" />
            {c.sectionLabel}
          </span>
          <h2 className="text-balance font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-[3.5rem]">
            {c.headline}
          </h2>
        </div>
      </div>

      <div>
        {c.items.map((item, i) => {
          const reversed = i % 2 !== 0;
          const accent = item.accent ?? "#10b981";
          return (
            <div
              key={item.title}
              className="trust-row relative flex items-center px-6 py-16 md:py-20"
            >
              <div
                className={`mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:gap-20 ${
                  reversed ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                <div className="flex-1 space-y-4 lg:max-w-xl">
                  <div
                    className="trust-line h-[2px] w-20 origin-left"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex items-center gap-3">
                    {item.num && (
                      <span
                        className="trust-num font-mono text-sm font-bold"
                        style={{ color: accent }}
                      >
                        {item.num}
                      </span>
                    )}
                    {item.label && (
                      <span className="trust-label font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {item.label}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    {item.verb ? (
                      <>
                        <span className="trust-verb block">{item.verb}</span>
                        <span
                          className="trust-noun block"
                          style={{ color: accent }}
                        >
                          {item.noun ?? ""}
                        </span>
                      </>
                    ) : (
                      <span className="trust-verb block">{item.title}</span>
                    )}
                  </h3>
                  <p className="trust-desc max-w-lg text-base leading-relaxed text-foreground/75 sm:text-lg">
                    {item.desc}
                  </p>
                </div>

                <div className="trust-visual flex flex-1 justify-center lg:max-w-xl">
                  <TrustVisual
                    kind={item.visual}
                    accent={accent}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrustVisual({
  kind,
  accent,
  locale,
}: {
  kind?: TrustItem["visual"];
  accent: string;
  locale: Locale;
}) {
  if (kind === "no-sale") return <NoSaleVisual accent={accent} />;
  if (kind === "india-servers")
    return <IndiaServersVisual accent={accent} locale={locale} />;
  if (kind === "encryption")
    return <EncryptionVisual accent={accent} locale={locale} />;
  if (kind === "doctor-final")
    return <DoctorFinalVisual accent={accent} locale={locale} />;
  return null;
}

function NoSaleVisual({ accent }: { accent: string }) {
  const rows: { k: string; v: string }[] = [
    { k: "advertising", v: "DENIED" },
    { k: "third_party_share", v: "DENIED" },
    { k: "ai_training", v: "DENIED" },
    { k: "analytics_resale", v: "DENIED" },
  ];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card/85 p-5 font-mono text-xs shadow-[0_20px_60px_-20px_rgba(16,185,129,0.18)] backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        patient_data.policy
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.k}
            className="flex items-baseline justify-between border-b border-border/50 py-1.5 last:border-0"
          >
            <span className="text-muted-foreground">{r.k}</span>
            <span
              className="font-bold tracking-wider"
              style={{ color: accent }}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndiaServersVisual({
  accent,
  locale,
}: {
  accent: string;
  locale: Locale;
}) {
  // ID outline (rough archipelago) — different geometry than IN, signals locale immediately.
  const isId = locale === "id";
  const region = isId ? "ap-southeast-3 · Jakarta" : "ap-south-1 · Mumbai";
  const path = isId
    ? "M20 90 L60 80 L95 90 L120 75 L150 80 L180 95 L175 110 L140 115 L110 105 L80 115 L40 110 Z M50 130 L75 125 L100 135 L80 145 Z"
    : "M58 30 L120 22 L155 60 L168 110 L150 165 L100 200 L60 175 L40 130 L35 80 Z";
  const cx = isId ? 95 : 78;
  const cy = isId ? 100 : 120;
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card/85 p-6 shadow-[0_20px_60px_-20px_rgba(14,165,233,0.18)] backdrop-blur">
      <svg
        viewBox={isId ? "0 0 200 180" : "0 0 200 220"}
        className="mx-auto h-44 w-auto"
      >
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle cx={cx} cy={cy} r="4" fill={accent}>
          <animate
            attributeName="r"
            values="4;9;4"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx={cx} cy={cy} r="2" fill={accent} />
      </svg>
      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[11px]">
        <span className="text-muted-foreground">region</span>
        <span style={{ color: accent }} className="truncate">
          {region}
        </span>
      </div>
    </div>
  );
}

function EncryptionVisual({
  accent,
  locale,
}: {
  accent: string;
  locale: Locale;
}) {
  const linesIn = [
    "[10:42:18] consult_4521 · key_rotated",
    "[10:42:19] note_signed · dr.priya@larinova",
    "[10:42:21] export_pdf · access_logged",
    "[10:43:02] rx_dispatched · email_sent",
  ];
  const linesId = [
    "[10:42:18] konsultasi_4521 · key_rotated",
    "[10:42:19] catatan_ditandatangani · dr.budi@larinova",
    "[10:42:21] ekspor_pdf · akses_dicatat",
    "[10:43:02] resep_terkirim · email_sent",
  ];
  const lines = locale === "id" ? linesId : linesIn;
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card/85 p-5 shadow-[0_20px_60px_-20px_rgba(168,85,247,0.18)] backdrop-blur">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1a` }}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          AES-256 · TLS 1.3
        </div>
      </div>
      <div className="space-y-1 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
        {lines.map((l) => (
          <div key={l} className="truncate">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorFinalVisual({
  accent,
  locale,
}: {
  accent: string;
  locale: Locale;
}) {
  const isId = locale === "id";
  const patient = isId ? "Wahyu Pratama, 52" : "Ravi Kumar, 52";
  const draftLabel = isId ? "DRAFT · AI" : "DRAFT · AI";
  const aLine = isId
    ? "Demam akut — kemungkinan demam berdarah."
    : "Acute febrile illness — rule out dengue.";
  const pLine = isId
    ? "Parasetamol 500mg 3× sehari × 3hr · CBC + NS1 hari ini."
    : "Paracetamol 500mg TDS × 3d · CBC + NS1 today.";
  const signedBy = isId ? "Ditandatangani oleh" : "Signed by";
  const doctor = isId ? "Dr. Sari Wibowo" : "Dr. Priya Iyer";
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card/85 p-5 shadow-[0_20px_60px_-20px_rgba(245,158,11,0.18)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>SOAP · {patient}</span>
        <span
          className="rounded-full border px-2 py-0.5 text-[9px]"
          style={{ borderColor: `${accent}66`, color: accent }}
        >
          {draftLabel}
        </span>
      </div>
      <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
        <div>
          <span className="font-mono text-[10px] text-foreground">A:</span>{" "}
          {aLine}
        </div>
        <div>
          <span className="font-mono text-[10px] text-foreground">P:</span>{" "}
          {pLine}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accent}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span className="text-[12px] text-foreground">
          {signedBy}{" "}
          <span style={{ color: accent }} className="font-medium">
            {doctor}
          </span>
        </span>
      </div>
    </div>
  );
}
