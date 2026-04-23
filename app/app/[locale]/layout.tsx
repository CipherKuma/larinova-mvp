import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter, Outfit, IBM_Plex_Mono, Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { notFound } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import BetaTranslationBanner from "@/components/layout/BetaTranslationBanner";
import { SwRegister } from "@/components/pwa/sw-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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

  // Get messages for the locale - pass locale explicitly
  const messages = await getMessages({ locale });

  const dir = "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`dark grain ${inter.variable} ${outfit.variable} ${ibmPlexMono.variable} ${cairo.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Larinova" />
        <meta name="theme-color" content="#0b0b0f" />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <BetaTranslationBanner />
          {children}
          <Toaster />
          <SwRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
