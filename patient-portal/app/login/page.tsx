import Image from "next/image";
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
      <div className="relative h-56 w-full overflow-hidden md:order-2 md:h-auto md:w-1/2 lg:w-3/5">
        <Image
          src="/images/login-hero.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
        />
        {/* Edge gradient bleeds the photo into the form column */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background md:bg-gradient-to-r md:from-background md:via-background/30 md:to-transparent"
        />
        {/* Brand quote, lower-right of the photo on desktop */}
        <div className="pointer-events-none absolute inset-x-6 bottom-6 hidden md:block md:right-10 md:bottom-12 md:left-auto md:max-w-sm">
          <p className="font-display text-2xl leading-snug text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
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

        <div className="relative w-full max-w-md space-y-8">
          <div className="space-y-3">
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Patient Portal
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
              Welcome back.
            </h1>
            <p className="text-base text-foreground/70">
              Enter your email — we&apos;ll send a magic link. No password
              needed.
            </p>
          </div>
          <LoginForm next={next ?? "/"} />
        </div>
      </div>
    </main>
  );
}
