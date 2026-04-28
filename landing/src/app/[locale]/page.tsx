import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HeroIndia } from "@/components/HeroIndia";
import { WarpField } from "@/components/WarpField";
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
import { type Locale, content as localeContent } from "@/data/locale-content";

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
      title: "Larinova | Platform OPD untuk Dokter Indonesia",
      description:
        "Platform OPD bertenaga AI untuk dokter Indonesia. Booking, intake terpandu AI, Prep Brief pra-konsultasi, catatan SOAP real-time dalam Bahasa Indonesia/Jawa/Inggris, dan tindak lanjut wellness otomatis.",
      keywords: [
        "platform OPD",
        "asisten OPD dokter",
        "transkripsi medis Indonesia",
        "catatan SOAP",
        "tindak lanjut pasien",
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
        title: "Larinova | Platform OPD untuk Dokter Indonesia",
        description:
          "Asisten OPD paling canggih untuk dokter Indonesia. Lebih banyak pasien, lebih sedikit ketikan. Resep dan tindak lanjut lewat email, SMS, dan WhatsApp.",
        url: `${SITE_URL}/id`,
        siteName: SITE_NAME,
        locale: "id_ID",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Larinova | Platform OPD untuk Dokter Indonesia",
        description:
          "Platform OPD AI untuk dokter Indonesia: booking, intake, Prep Brief, catatan SOAP real-time, dan tindak lanjut otomatis.",
      },
    };
  }

  // Default: India locale
  return {
    title: "Larinova | OPD Platform for Indian Doctors",
    description:
      "The AI-powered OPD platform for Indian doctors. Booking, AI-guided intake, pre-consult Prep Brief, real-time SOAP notes in Tamil/Hindi/English, and automated wellness follow-up — one platform.",
    keywords: [
      "OPD platform",
      "OPD assistant for doctors",
      "Tamil medical transcription",
      "AI patient intake",
      "SOAP notes",
      "Indian healthcare AI",
      "Sarvam AI",
      "clinical documentation",
      "Larinova",
      "patient follow-up India",
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
      title: "Larinova | OPD Platform for Indian Doctors",
      description:
        "The most advanced OPD assistant for Indian doctors. See more patients. Type less. Send prescriptions and follow-ups by email, SMS, and WhatsApp.",
      url: `${SITE_URL}/in`,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Larinova | OPD Platform for Indian Doctors",
      description:
        "AI-powered OPD platform for Indian doctors: booking, intake, Prep Brief, real-time SOAP notes in Tamil/Hindi/English, and automated follow-up.",
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
  const isOpd = !!localeContent[l].opd;

  return (
    <SmoothScroll>
      <WarpField className="fixed inset-0 z-0" />
      <Nav locale={l} />
      <main className="relative z-10">
        {isOpd ? <HeroIndia locale={l} /> : <Hero locale={l} />}
        <Problem locale={l} />
        {!isOpd && <HowItWorks locale={l} />}
        {isOpd ? <FeaturesIndia locale={l} /> : <Features locale={l} />}
        <Trust locale={l} />
        <PoweredBySarvam locale={l} />
        {isOpd ? <PricingIndia locale={l} /> : <Pricing locale={l} />}
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
