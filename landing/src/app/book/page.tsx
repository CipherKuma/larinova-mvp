import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Book a Discovery Call",
  description:
    "Schedule a free 30-minute call to see how Larinova can streamline your clinical documentation workflow.",
  alternates: { canonical: "https://larinova.com/book" },
};

export default function BookPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Ambient emerald glow — mirrors FinalCTA / DiscoveryForm */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-primary/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="group">
              <div className="flex items-center gap-2 transform group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/larinova-icon.png"
                  alt="Larinova"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                  priority
                />
                <span className="text-xl font-semibold text-foreground tracking-tight">
                  Larinova
                </span>
              </div>
            </Link>
            <Link
              href="https://app.larinova.com"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(16,185,129,0.55)] transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-28 md:pt-36 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-10 md:mb-14">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 text-balance">
              Book a <span className="text-gradient">Discovery Call</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed text-balance">
              A free 30-minute call to walk through your clinic and show you
              exactly how Larinova fits into a real OPD day.
            </p>
          </div>

          {/* What to expect — moved above the embed as a confidence row */}
          <div className="mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: "demo",
                title: "Live demo",
                body: "Real consult, real SOAP note.",
              },
              {
                icon: "qa",
                title: "Your questions",
                body: "Workflow, pricing, languages.",
              },
              {
                icon: "free",
                title: "No obligation",
                body: "We'll set you up only if it fits.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left backdrop-blur"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Cal.com Embed — wrapped in a glass card with ambient glow */}
          <div className="relative mx-auto max-w-3xl">
            {/* Embed glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl opacity-60"
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-1 shadow-[0_30px_80px_-30px_rgba(16,185,129,0.35)]">
              <div className="overflow-hidden rounded-[calc(1rem-2px)] bg-card">
                {/* Cal embed — hide_event_type_details and hide_branding minimize watermarks */}
                <iframe
                  src="https://cal.com/gabrielaxy/larinova?embed=true&theme=dark&hide_event_type_details=1&layout=month_view"
                  className="block w-full"
                  style={{ minHeight: "660px", height: "min(82vh, 760px)" }}
                  frameBorder="0"
                  title="Book a call with Larinova"
                />
              </div>
            </div>
          </div>

          {/* Reassurance line */}
          <p className="mt-10 text-center text-sm text-foreground/55">
            Can't find a time?{" "}
            <a
              href="mailto:hello@larinova.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              Email hello@larinova.com
            </a>{" "}
            and we'll work around your schedule.
          </p>
        </div>
      </main>
    </div>
  );
}
