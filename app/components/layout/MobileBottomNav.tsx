"use client";

import { Link, usePathname } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  Calendar,
  Stethoscope,
  CheckSquare,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { MobileMoreSheet } from "./MobileMoreSheet";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  match: (pathname: string, locale: string) => boolean;
}

function isOnPath(pathname: string, locale: string, prefix: string): boolean {
  const stripped = pathname.replace(`/${locale}`, "") || "/";
  if (prefix === "/") return stripped === "/";
  return stripped === prefix || stripped.startsWith(`${prefix}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const [moreOpen, setMoreOpen] = useState(false);

  const items: NavItem[] = [
    {
      href: "/",
      icon: Home,
      label: t("navigation.home"),
      match: (p, l) => isOnPath(p, l, "/"),
    },
    {
      href: "/calendar",
      icon: Calendar,
      label: t("navigation.calendar"),
      match: (p, l) => isOnPath(p, l, "/calendar"),
    },
    {
      href: "/consultations",
      icon: Stethoscope,
      label: t("navigation.consultations"),
      match: (p, l) => isOnPath(p, l, "/consultations"),
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      label: t("navigation.tasks"),
      match: (p, l) => isOnPath(p, l, "/tasks"),
    },
  ];

  const moreActive = ["/patients", "/documents", "/issues", "/settings"].some(
    (p) => isOnPath(pathname, locale, p),
  );

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40
          bg-background/95 backdrop-blur-lg
          border-t border-border/60
          flex items-stretch
        "
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        aria-label="Primary"
      >
        {items.map((item) => {
          const active = item.match(pathname, locale);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 py-2.5 active:bg-muted/40"
              aria-current={active ? "page" : undefined}
            >
              <span
                aria-hidden
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-b-full transition-colors ${
                  active ? "bg-primary" : "bg-transparent"
                }`}
              />
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[11px] leading-none transition-colors ${
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 py-2.5 active:bg-muted/40"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span
            aria-hidden
            className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-b-full transition-colors ${
              moreActive ? "bg-primary" : "bg-transparent"
            }`}
          />
          <Menu
            className={`w-[22px] h-[22px] transition-colors ${
              moreActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <span
            className={`text-[11px] leading-none transition-colors ${
              moreActive
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            More
          </span>
        </button>
      </nav>

      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
