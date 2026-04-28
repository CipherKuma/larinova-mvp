import Link from "next/link";
import SignOutButton from "./SignOutButton";

function initials(name: string | null, email: string): string {
  const source = (name ?? email.split("@")[0] ?? "").trim();
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PortalHeader({
  email,
  name = null,
}: {
  email: string;
  name?: string | null;
}) {
  const display = name?.trim() || email.split("@")[0];
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/8 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3.5 md:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-base font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 transition group-hover:bg-primary/25">
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

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 rounded-full border border-foreground/10 bg-card/60 px-2 py-1 pr-3">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 text-[11px] font-semibold tracking-wide text-foreground"
            >
              {initials(name, email)}
            </span>
            <span className="hidden max-w-[180px] truncate text-xs font-medium text-foreground/85 sm:inline">
              {display}
            </span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
