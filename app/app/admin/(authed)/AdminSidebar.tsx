"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/surveys", label: "Survey responses" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/issues", label: "Issues" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/admin/sign-in");
    }
  };

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const isActive = isItemActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={
              "px-3 py-2.5 rounded-md text-sm transition " +
              (isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const logoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      disabled={signingOut}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-muted/50 hover:text-red-600 transition disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Larinova · Admin
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-mr-2 h-10 w-10 inline-flex items-center justify-center rounded-md text-foreground hover:bg-muted/50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border h-dvh sticky top-0 p-4 bg-background flex-col">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 px-2">
          Larinova · Admin
        </div>
        {navLinks}
        <div className="mt-auto pt-4 border-t border-border/60">
          {logoutButton}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="absolute left-0 top-0 h-dvh w-72 max-w-[85vw] bg-background border-r border-border p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground px-2">
                Larinova · Admin
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navLinks}
            <div className="mt-auto pt-4 border-t border-border/60">
              {logoutButton}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
