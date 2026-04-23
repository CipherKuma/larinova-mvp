import type { Metadata } from "next";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
