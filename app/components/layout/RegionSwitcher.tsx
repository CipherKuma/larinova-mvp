"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const REGIONS = [
  { code: "in", label: "India", flag: "🇮🇳" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
] as const;

export function RegionSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = REGIONS.find((r) => r.code === locale) ?? REGIONS[0];

  async function switchTo(code: "in" | "id") {
    if (code === locale) return;

    // Rewrite path /in/foo → /id/foo
    const newPath = pathname.replace(/^\/(in|id)(?=\/|$)/, `/${code}`);

    // Set cookie
    document.cookie = `larinova_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Persist to DB if authenticated (fire-and-forget)
    fetch("/api/user/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    }).catch(() => {});

    router.push(newPath);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span>{current.flag}</span>
          <span>{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {REGIONS.map((r) => (
          <DropdownMenuItem
            key={r.code}
            onClick={() => switchTo(r.code)}
            className="gap-2"
          >
            <span>{r.flag}</span>
            <span>{r.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
