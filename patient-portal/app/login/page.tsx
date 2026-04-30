import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-screen w-full flex-col md:flex-row">
      {/* Hero column — sits above the form on mobile, right side on desktop */}
      <div className="relative h-72 w-full overflow-hidden md:order-2 md:h-auto md:w-1/2 lg:w-3/5">
        <Image
          src="/images/login-hero.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          style={{ objectPosition: "70% 30%" }}
          className="object-cover"
        />
        {/* Edge gradient bleeds the photo into the form column */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/0 to-background/95 md:bg-gradient-to-r md:from-background md:via-background/20 md:to-transparent"
        />
        {/* Brand quote, lower-right of the photo on desktop, bottom-left on mobile */}
        <div className="pointer-events-none absolute inset-x-6 bottom-5 max-w-sm md:right-10 md:bottom-14 md:left-auto md:inset-x-auto">
          <p className="font-display text-xl leading-snug text-foreground drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] md:text-2xl">
            Your records, your appointments —{" "}
            <span className="text-primary">all in one place.</span>
          </p>
        </div>
      </div>

      {/* Form column */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-16 md:order-1 md:w-1/2 md:px-10 lg:w-2/5">
        {/* Soft emerald halo behind the heading */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "640px",
            height: "640px",
            background:
              "radial-gradient(circle at center, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.04) 35%, transparent 65%)",
          }}
        />

        <div className="relative w-full max-w-md space-y-9">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-base font-semibold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h3l2-5 4 10 2-5h3" />
              </svg>
            </span>
            <span className="font-display">Larinova</span>
          </Link>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Patient Portal
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-[44px]">
              Welcome back.
            </h1>
            <p className="max-w-prose text-base text-foreground/70">
              Enter your email — we&apos;ll send a magic link. No password
              needed.
            </p>
          </div>

          <LoginForm next={next ?? "/"} />

          <p className="border-t border-foreground/8 pt-5 text-xs leading-relaxed text-foreground/50">
            Trouble signing in? Email{" "}
            <a
              href="mailto:hello@larinova.com"
              className="font-medium text-foreground/75 underline decoration-foreground/20 underline-offset-4 transition hover:text-foreground hover:decoration-foreground/60"
            >
              hello@larinova.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
