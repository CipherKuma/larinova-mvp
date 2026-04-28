import { type Locale, content as localeContent } from "@/data/locale-content";

type Variant = "afterProblem" | "afterDemo";

interface InlineCTAProps {
  locale: Locale;
  variant: Variant;
}

export function InlineCTA({ locale, variant }: InlineCTAProps) {
  const c = localeContent[locale].inlineCta;
  const text = c[variant];

  return (
    <section
      aria-label="Call to action"
      className="relative bg-background py-10 sm:py-14"
    >
      <div className="mx-auto flex max-w-6xl justify-center px-6">
        <a
          href={c.href}
          className="group inline-flex items-center gap-2 font-mono text-sm text-foreground/70 transition-colors hover:text-foreground"
        >
          <span className="relative">
            {text}
            <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-100 bg-foreground/30 transition-colors group-hover:bg-primary" />
          </span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
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
    </section>
  );
}
