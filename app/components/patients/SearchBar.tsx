"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Auto-search as user types with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      router.push(`/patients?${params.toString()}` as any);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, router]);

  const handleClear = () => {
    setQuery("");
    router.push("/patients" as any);
  };

  return (
    <div className="relative mb-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("patients.searchByNameOrCode")}
        className="
          w-full pl-12 pr-12 py-3
          border border-border bg-card text-foreground
          focus:outline-none
          text-sm tracking-wider
        "
      />
      <Search
        className="
        absolute left-4 top-1/2 -translate-y-1/2
        w-5 h-5
      "
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            hover:opacity-70
            transition-opacity
          "
          aria-label={t("common.clearSearch")}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
