import type { Metadata } from "next";
import { Inter, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import PageBackdrop from "@/components/PageBackdrop";

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

export const metadata: Metadata = {
  title: "Larinova Patient Portal",
  description: "Manage appointments, prescriptions, and documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark grain h-full antialiased ${inter.variable} ${outfit.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <PageBackdrop />
        {children}
      </body>
    </html>
  );
}
