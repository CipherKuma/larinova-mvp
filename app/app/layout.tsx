import type { Metadata, Viewport } from "next";
import { Inter, Outfit, IBM_Plex_Mono, Cairo } from "next/font/google";
import { PwaLaunchSplash } from "@/components/pwa/launch-splash";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Larinova - AI Medical Platform",
    template: "%s | Larinova",
  },
  description:
    "Zero-knowledge AI medical platform for healthcare privacy, automated consultations, and complete patient data sovereignty.",
  metadataBase: new URL("https://app.larinova.com"),
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    siteName: "Larinova",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "dark",
  themeColor: "#0b0b0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`dark grain ${inter.variable} ${outfit.variable} ${ibmPlexMono.variable} ${cairo.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var matchMedia = window.matchMedia;
                  var isStandalone =
                    (matchMedia &&
                      (matchMedia("(display-mode: standalone)").matches ||
                        matchMedia("(display-mode: fullscreen)").matches)) ||
                    window.navigator.standalone === true;
                  var reduceMotion =
                    matchMedia &&
                    matchMedia("(prefers-reduced-motion: reduce)").matches;

                  if (isStandalone && !reduceMotion) {
                    document.documentElement.classList.add("larinova-pwa-launch");
                  }
                } catch (error) {}
              })();
            `,
          }}
        />
        <link
          rel="apple-touch-icon"
          href="/icons/apple-touch-icon-180.png?v=20260501"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Larinova" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <PwaLaunchSplash />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
