"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { RegionSwitcher } from "@/components/layout/RegionSwitcher";

interface Doctor {
  full_name: string;
}

export function TopNavbar() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    fetchDoctorInfo();
  }, []);

  const fetchDoctorInfo = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("larinova_doctors")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setDoctor(data);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  const getQuoteOfTheDay = () => {
    const quotes = [
      t("quote1"),
      t("quote2"),
      t("quote3"),
      t("quote4"),
      t("quote5"),
      t("quote6"),
      t("quote7"),
      t("quote8"),
      t("quote9"),
      t("quote10"),
    ];
    const dayOfYear = Math.floor(
      (new Date().getTime() -
        new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    return quotes[dayOfYear % quotes.length];
  };

  const getFirstName = (fullName: string) => {
    const parts = fullName.split(" ");
    if (parts[0].toLowerCase() === "dr." && parts.length > 1) {
      return `Dr. ${parts[1]}`;
    }
    return parts[0];
  };

  return (
    <div className="bg-card border-b border-border flex items-center justify-between px-6 py-[14px]">
      {/* Left: Greeting and Quote */}
      <div className="flex flex-col justify-center">
        <h1 className="text-xl font-bold text-foreground leading-tight">
          {getCurrentGreeting()}
          {loading
            ? "..."
            : doctor
              ? `, ${getFirstName(doctor.full_name)}`
              : ""}
        </h1>
        <p className="text-xs text-muted-foreground italic mt-1 max-w-2xl truncate">
          "{getQuoteOfTheDay()}"
        </p>
      </div>

      {/* Right: Region switcher + Date and Day */}
      <div className="flex items-center gap-4">
        <RegionSwitcher />
        <div className="text-right">
          <p className="text-base font-semibold text-foreground leading-tight">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
            })}
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
