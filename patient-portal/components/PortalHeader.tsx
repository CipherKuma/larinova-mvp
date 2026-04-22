import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function PortalHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Larinova
        </Link>
        <div className="flex items-center gap-3 text-xs text-foreground/60">
          <span className="hidden sm:inline">{email}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
