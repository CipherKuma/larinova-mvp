import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import BetaTranslationBanner from "@/components/layout/BetaTranslationBanner";
import { SwRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // html/body + fonts live in the root layout (app/layout.tsx) so admin
  // and any other root-level routes inherit them too. This layout only
  // adds locale-scoped intl context + doctor-app chrome.
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <BetaTranslationBanner />
      <AnalyticsProvider />
      {children}
      <SwRegister />
      <InstallPrompt />
    </NextIntlClientProvider>
  );
}
