"use client";

import Image from "next/image";
import { usePathname } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { sharedAsset } from "@/lib/locale-asset";
import { useEffect, useState } from "react";

function getPageTitle(
  pathname: string,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): string | null {
  const stripped = pathname.replace(`/${locale}`, "") || "/";
  const segments = stripped.split("/").filter(Boolean);
  const root = segments[0];

  if (!root) return null;
  if (root === "patients") return t("navigation.patients");
  if (root === "consultations") return t("navigation.consultations");
  if (root === "tasks") return t("navigation.tasks");
  if (root === "documents") return t("navigation.documents");
  if (root === "calendar") return t("navigation.calendar");
  if (root === "issues") return "Issues";
  if (root === "settings") {
    if (segments[1] === "billing") return t("navigation.billing");
    return t("navigation.settings");
  }
  return null;
}

export function MobileTopBar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const title = getPageTitle(pathname, locale, t);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4
        bg-background/95 backdrop-blur-lg
        transition-[border-color,box-shadow] duration-200
        ${scrolled ? "border-b border-border/60 shadow-[0_1px_0_rgba(0,0,0,0.04)]" : "border-b border-transparent"}
      `}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Image
          src={sharedAsset("larinova-icon.png")}
          alt="Larinova"
          width={28}
          height={28}
          className="object-contain shrink-0"
          priority
        />
        {title ? (
          <span className="font-display font-semibold text-foreground tracking-tight truncate">
            {title}
          </span>
        ) : (
          <span className="font-display font-semibold text-foreground tracking-tight">
            Larinova
          </span>
        )}
      </div>
    </header>
  );
}
