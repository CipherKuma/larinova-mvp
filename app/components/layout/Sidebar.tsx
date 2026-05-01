"use client";

import Image from "next/image";
import { Link, usePathname, useRouter } from "@/src/i18n/routing";
import {
  Home,
  Users,
  LogOut,
  Stethoscope,
  CheckSquare,
  FileText,
  CreditCard,
  Zap,
  UserCircle,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { sharedAsset } from "@/lib/locale-asset";
import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { RegionSwitcher } from "./RegionSwitcher";
import type { UserShellDoctor } from "@/lib/user-shell";

interface SidebarProps {
  initialDoctor: UserShellDoctor | null;
  initialPlan?: "free" | "pro";
}

export function Sidebar({ initialDoctor, initialPlan = "free" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [doctor, setDoctor] = useState<UserShellDoctor | null>(initialDoctor);
  const [loading, setLoading] = useState(!initialDoctor);
  const [plan, setPlan] = useState<string>(initialPlan);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  useEffect(() => {
    if (initialDoctor) return;
    let cancelled = false;
    async function fetchShell() {
      try {
        const res = await fetch("/api/user/shell");
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setDoctor(data.doctor ?? null);
        setPlan(data.plan ?? "free");
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchShell();
    return () => {
      cancelled = true;
    };
  }, [initialDoctor, router]);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const isActive = (path: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    return pathWithoutLocale === path || pathname === `/${locale}${path}`;
  };

  const open = !isCollapsed;

  return (
    <motion.aside
      className="h-screen bg-card border-r border-border
        ltr:rounded-l-none ltr:rounded-tr-none
        rtl:rounded-r-none rtl:rounded-tl-none
        hidden md:flex flex-col shrink-0 overflow-hidden"
      animate={{
        width: open ? 256 : 80,
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center p-4 h-[72px]">
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center h-[48px]"
            >
              <Image
                src={sharedAsset("dark-mode-icon-only.png")}
                alt="Larinova"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </motion.div>
          ) : (
            <motion.div
              key="full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center h-[48px]"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={sharedAsset("dark-mode-icon-only.png")}
                  alt="Larinova"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
                <span className="font-display font-semibold text-foreground tracking-tight">
                  Larinova
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1">
        <SidebarNavLink
          href="/"
          icon={<Home className="w-5 h-5 flex-shrink-0" />}
          label={t("navigation.home")}
          active={isActive("/")}
          open={open}
          dataTour="home"
        />
        <SidebarNavLink
          href="/patients"
          icon={<Users className="w-5 h-5 flex-shrink-0" />}
          label={t("navigation.patients")}
          active={isActive("/patients") || pathname.includes("/patients")}
          open={open}
          dataTour="patients"
        />
        <SidebarNavLink
          href="/consultations"
          icon={<Stethoscope className="w-5 h-5 flex-shrink-0" />}
          label={t("navigation.consultations")}
          active={
            isActive("/consultations") || pathname.includes("/consultations")
          }
          open={open}
          dataTour="consultations"
        />
        <SidebarNavLink
          href="/tasks"
          icon={<CheckSquare className="w-5 h-5 flex-shrink-0" />}
          label={t("navigation.tasks")}
          active={isActive("/tasks")}
          open={open}
          dataTour="tasks"
        />
        <SidebarNavLink
          href="/documents"
          icon={<FileText className="w-5 h-5 flex-shrink-0" />}
          label={t("navigation.documents")}
          active={isActive("/documents")}
          open={open}
          dataTour="documents"
        />
        <SidebarNavLink
          href="/calendar"
          icon={<Calendar className="w-5 h-5 flex-shrink-0" />}
          label={t("navigation.calendar")}
          active={isActive("/calendar") || pathname.includes("/calendar")}
          open={open}
        />
        <SidebarNavLink
          href="/issues"
          icon={<HelpCircle className="w-5 h-5 flex-shrink-0" />}
          label="Issues"
          active={isActive("/issues") || pathname.includes("/issues")}
          open={open}
        />
        {locale !== "id" && (
          <SidebarNavLink
            href="/settings/billing"
            icon={<CreditCard className="w-5 h-5 flex-shrink-0" />}
            label={t("navigation.billing")}
            active={pathname.includes("/settings/billing")}
            open={open}
            badge={plan === "pro" ? "Pro" : "Free"}
            badgeVariant={plan === "pro" ? "primary" : "muted"}
          />
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-1 border-t border-border/50">
        {/* Region switcher */}
        <RegionSwitcher open={open} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full
            px-3 py-3
            rounded-xl
            text-sm font-medium text-muted-foreground
            hover:text-red-600
            transition-colors duration-200
            group
            ${!open ? "justify-center" : ""}`}
          title={!open ? t("common.logout") : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <motion.span
            animate={{
              display: open ? "inline-block" : "none",
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="whitespace-pre"
          >
            {t("common.logout")}
          </motion.span>
        </button>

        {/* Doctor Profile */}
        <div
          className={`flex items-center gap-3 px-3 py-2.5 ${!open ? "justify-center" : ""}`}
        >
          <div className="flex-shrink-0">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-foreground" />
              </div>
            )}
          </div>
          <motion.div
            animate={{
              display: open ? "block" : "none",
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="min-w-0"
          >
            {loading ? (
              <>
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                <div className="h-3 bg-muted rounded w-16 animate-pulse mt-1" />
              </>
            ) : doctor ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate text-foreground">
                    {doctor.full_name ?? "—"}
                  </span>
                  {plan === "pro" && (
                    <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {doctor.specialization ?? ""}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">
                {t("common.failedToLoadProfile")}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}

function SidebarNavLink({
  href,
  icon,
  label,
  active,
  open,
  dataTour,
  badge,
  badgeVariant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  open: boolean;
  dataTour?: string;
  badge?: string;
  badgeVariant?: "primary" | "muted";
}) {
  return (
    <Link
      href={href}
      data-tour={dataTour}
      className={`
        flex items-center gap-3
        px-3 py-3
        rounded-xl
        text-sm font-medium
        transition-colors duration-200
        group
        ${!open ? "justify-center" : ""}
        ${active ? "border-l-2 border-primary" : ""}
      `}
      title={!open ? label : ""}
    >
      <span
        className={`transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
      >
        {icon}
      </span>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className={`whitespace-pre ${active ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"}`}
      >
        {label}
      </motion.span>
      {open && badge && (
        <motion.span
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
            badgeVariant === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {badge}
        </motion.span>
      )}
    </Link>
  );
}
