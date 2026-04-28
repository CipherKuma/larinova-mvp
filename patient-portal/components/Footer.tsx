import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-foreground/6 px-5 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-xs text-foreground/55 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Need help? Email{" "}
          <Link
            href="mailto:hello@larinova.com"
            className="font-medium text-foreground/80 underline decoration-foreground/20 underline-offset-4 transition hover:text-foreground hover:decoration-foreground/60"
          >
            hello@larinova.com
          </Link>
          .
        </p>
        <p className="font-mono uppercase tracking-[0.18em]">
          Larinova · Patient Portal
        </p>
      </div>
    </footer>
  );
}
