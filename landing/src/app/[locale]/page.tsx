import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HeroIndia } from "@/components/HeroIndia";
import { Problem } from "@/components/Problem";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { FeaturesIndia } from "@/components/FeaturesIndia";
import { Trust } from "@/components/Trust";
import { PoweredBySarvam } from "@/components/PoweredBySarvam";
import { Pricing } from "@/components/Pricing";
import { PricingIndia } from "@/components/PricingIndia";
import { FAQ } from "@/components/FAQ";
import { Blog } from "@/components/Blog";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { FAQS } from "@/data/faqs";
import { FAQS_ID } from "@/data/faqs-id";
import {
  generateFAQPageJsonLd,
  generateSoftwareApplicationJsonLd,
} from "@/lib/structured-data";
import { SITE_URL, SITE_NAME } from "@/lib/metadata";
import { type Locale } from "@/data/locale-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const VALID_LOCALES: Locale[] = ["in", "id"];

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "id") {
    return {
      title: "Larinova | AI Medical Scribe untuk Dokter Indonesia",
      description:
        "AI medical scribe yang memahami Bahasa Indonesia, Jawa, dan Inggris. Transkripsi konsultasi real-time, catatan SOAP, resep - didukung Deepgram AI.",
      keywords: [
        "AI medical scribe",
        "transkripsi medis Indonesia",
        "catatan SOAP",
        "Deepgram AI",
        "dokumentasi klinis",
        "Larinova",
        "dokter Indonesia",
        "aplikasi dokter",
      ],
      alternates: {
        canonical: `${SITE_URL}/id`,
        languages: {
          "en-IN": `${SITE_URL}/in`,
          id: `${SITE_URL}/id`,
          "x-default": `${SITE_URL}/in`,
        },
      },
      openGraph: {
        title: "Larinova | AI Medical Scribe untuk Dokter Indonesia",
        description:
          "Pasien Anda berbicara Bahasa Indonesia. Scribe Anda juga harus bisa.",
        url: `${SITE_URL}/id`,
        siteName: SITE_NAME,
        locale: "id_ID",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Larinova | AI Medical Scribe untuk Dokter Indonesia",
        description:
          "AI medical scribe yang memahami Bahasa Indonesia. Transkripsi real-time, catatan SOAP, resep.",
      },
    };
  }

  // Default: India locale
  return {
    title: "Larinova | AI Medical Scribe for Indian Doctors",
    description:
      "AI-powered medical scribe that understands Tamil, Hindi, and English. Real-time consultation transcription, SOAP notes, prescriptions - built on Sarvam AI.",
    keywords: [
      "AI medical scribe",
      "Tamil medical transcription",
      "SOAP notes",
      "Indian healthcare AI",
      "Sarvam AI",
      "clinical documentation",
      "Larinova",
      "medical scribe India",
    ],
    alternates: {
      canonical: `${SITE_URL}/in`,
      languages: {
        "en-IN": `${SITE_URL}/in`,
        id: `${SITE_URL}/id`,
        "x-default": `${SITE_URL}/in`,
      },
    },
    openGraph: {
      title: "Larinova | AI Medical Scribe for Indian Doctors",
      description:
        "Your patients speak Tamil. Your scribe should too. AI-powered medical documentation for Indian doctors.",
      url: `${SITE_URL}/in`,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Larinova | AI Medical Scribe for Indian Doctors",
      description:
        "AI medical scribe that understands Tamil, Hindi, and English. Real-time transcription, SOAP notes, prescriptions.",
    },
  };
}

export default async function LocaleLandingPage({ params }: PageProps) {
  const { locale } = await params;

  if (!VALID_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const l = locale as Locale;
  const faqs = l === "id" ? FAQS_ID : FAQS;
  const isIndiaOpd = l === "in";

  return (
    <SmoothScroll>
      <Nav locale={l} />
      <main>
        {isIndiaOpd ? <HeroIndia locale={l} /> : <Hero locale={l} />}
        <Problem locale={l} />
        {!isIndiaOpd && <HowItWorks locale={l} />}
        {isIndiaOpd ? <FeaturesIndia locale={l} /> : <Features locale={l} />}
        <Trust locale={l} />
        <PoweredBySarvam locale={l} />
        {isIndiaOpd ? <PricingIndia locale={l} /> : <Pricing locale={l} />}
        <FAQ locale={l} />
        <Blog locale={l} />
        <FinalCTA locale={l} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQPageJsonLd(faqs)),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateSoftwareApplicationJsonLd()),
          }}
        />
      </main>
      <Footer locale={l} />
      <MobileCTA locale={l} />
      <Toaster position="bottom-right" theme="dark" />
    </SmoothScroll>
  );
}
