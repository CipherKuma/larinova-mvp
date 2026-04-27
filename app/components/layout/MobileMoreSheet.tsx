"use client";

import { Link, useRouter } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  Users,
  FileText,
  HelpCircle,
  CreditCard,
  LogOut,
  UserCircle,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Doctor {
  full_name: string;
  specialization: string;
}

const REGIONS = [
  { code: "in" as const, label: "India", flag: "🇮🇳" },
  { code: "id" as const, label: "Indonesia", flag: "🇮🇩" },
];

export function MobileMoreSheet({ open, onClose }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("larinova_doctors")
          .select("full_name, specialization")
          .eq("user_id", user.id)
          .single();
        if (data) setDoctor(data);
        try {
          const res = await fetch("/api/subscription/status");
          if (res.ok) {
            const j = await res.json();
            setPlan(j.subscription?.plan ?? "free");
          }
        } catch {}
      } catch {}
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/sign-in");
  };

  const switchRegion = async (code: "in" | "id") => {
    if (code === locale) return;
    document.cookie = `larinova_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    fetch("/api/user/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    }).catch(() => {});
    onClose();
    if (typeof window !== "undefined") {
      window.location.href = window.location.pathname.replace(
        /^\/(in|id)(?=\/|$)/,
        `/${code}`,
      );
    }
  };

  const items: { href: string; icon: LucideIcon; label: string }[] = [
    { href: "/patients", icon: Users, label: t("navigation.patients") },
    { href: "/documents", icon: FileText, label: t("navigation.documents") },
    { href: "/issues", icon: HelpCircle, label: "Issues" },
  ];
  if (locale !== "id") {
    items.push({
      href: "/settings/billing",
      icon: CreditCard,
      label: t("navigation.billing"),
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="md:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50
              bg-card border-t border-border rounded-t-2xl
              max-h-[85vh] overflow-y-auto
            "
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="More"
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div
                aria-hidden
                className="absolute left-1/2 top-2 -translate-x-1/2 h-1 w-10 rounded-full bg-muted"
              />
              <span className="font-display font-semibold text-base text-foreground">
                More
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 h-10 w-10 inline-flex items-center justify-center rounded-full text-muted-foreground active:bg-muted/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor profile */}
            <div className="px-4 py-3 mx-4 my-2 rounded-xl bg-muted/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0">
                <UserCircle className="w-6 h-6 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {doctor?.full_name ?? "—"}
                  </span>
                  {plan === "pro" && (
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {doctor?.specialization ?? ""}
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div className="px-2 py-1">
              {items.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground active:bg-muted/40 min-h-[48px]"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <div className="h-px bg-border/60 mx-4 my-2" />

            {/* Logout */}
            <div className="px-2 pb-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 active:bg-red-500/10 min-h-[48px]"
              >
                <LogOut className="w-5 h-5" />
                <span>{t("common.logout")}</span>
              </button>
            </div>

            {/* Subtle region switcher — text-only footer, low emphasis */}
            <div className="px-4 pb-3 flex items-center justify-center gap-3">
              {REGIONS.map((r, i) => {
                const active = r.code === locale;
                return (
                  <span key={r.code} className="flex items-center gap-3">
                    <button
                      onClick={() => switchRegion(r.code)}
                      className={`text-[11px] tracking-wide ${
                        active
                          ? "text-muted-foreground/80 font-medium"
                          : "text-muted-foreground/50 hover:text-muted-foreground/80"
                      }`}
                      aria-label={`Switch region to ${r.label}`}
                      aria-pressed={active}
                    >
                      {r.label}
                    </button>
                    {i < REGIONS.length - 1 && (
                      <span
                        aria-hidden
                        className="text-muted-foreground/30 text-[11px]"
                      >
                        ·
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
