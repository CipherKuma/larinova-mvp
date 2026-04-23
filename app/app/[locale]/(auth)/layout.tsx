"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { ParticleDust } from "@/components/onboarding/ParticleDust";
import { useLocaleAsset } from "@/lib/locale-asset";

const slogans: Record<string, { headline: string; subtitle: string }> = {
  en: {
    headline: "Your patients speak Tamil.\nYour documentation should too.",
    subtitle: "AI-powered medical documentation for Indian doctors",
  },
  id: {
    headline: "Your patients speak Bahasa.\nYour documentation should too.",
    subtitle: "AI-powered medical documentation for Indonesian doctors",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const asset = useLocaleAsset();
  const { headline, subtitle } = slogans[locale] ?? slogans.en;

  return (
    <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <ParticleDust />
      {/* Left — Form */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center lg:justify-start p-8 lg:p-16 xl:p-24">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Right — Image */}
      <div className="relative z-10 hidden lg:flex items-center justify-center p-6 xl:p-8">
        <div className="relative w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl aspect-[3/4] rounded-2xl overflow-hidden border border-border/20">
          <Image
            src={asset("auth-doctor.jpg")}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/60 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 z-10">
            <p className="text-xl font-display font-semibold text-white leading-snug">
              &ldquo;{headline.split("\n")[0]}
              <br />
              {headline.split("\n")[1]}&rdquo;
            </p>
            <p className="text-sm text-white/50 mt-3">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
