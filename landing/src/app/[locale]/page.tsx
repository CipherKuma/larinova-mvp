import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HeroIndia } from "@/components/HeroIndia";
import { DeferredWarpField } from "@/components/DeferredWarpField";
import { Problem } from "@/components/Problem";
import { InlineCTA } from "@/components/InlineCTA";
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
  generateMedicalBusinessJsonLd,
} from "@/lib/structured-data";
import { SITE_URL, SITE_NAME, KEYWORDS_IN, KEYWORDS_ID } from "@/lib/metadata";
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
    const title = "Larinova | Platform OPD lengkap untuk dokter Indonesia";
    const description =
      "Platform OPD end-to-end untuk dokter Indonesia: booking online, intake pasien terpandu AI, Prep Brief pra-konsultasi, catatan SOAP real-time dalam Bahasa Indonesia/Jawa/Inggris, kode ICD-10 otomatis, resep AI, dan tindak lanjut wellness lewat email, SMS, dan WhatsApp. HIPAA-ready, terenkripsi end-to-end.";
    const ogDescription =
      "Booking, intake, Prep Brief, catatan SOAP, ICD-10, resep, dan follow-up — satu platform untuk seluruh OPD Anda. HIPAA-ready.";

    return {
      title,
      description,
      keywords: KEYWORDS_ID,
      alternates: {
        canonical: `${SITE_URL}/id`,
        languages: {
          "en-IN": `${SITE_URL}/in`,
          id: `${SITE_URL}/id`,
          "x-default": `${SITE_URL}/in`,
        },
      },
      openGraph: {
        title,
        description: ogDescription,
        url: `${SITE_URL}/id`,
        siteName: SITE_NAME,
        locale: "id_ID",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: ogDescription,
      },
    };
  }

  // Default: India locale
  const title = "Larinova | End-to-end OPD platform for Indian doctors";
  const description =
    "The complete OPD platform for Indian doctors: online patient booking, AI-guided intake, pre-consult Prep Briefs, real-time SOAP notes in Tamil/Hindi/English (with code-mixing), automatic ICD-10 coding, AI-drafted prescriptions, and automated wellness follow-up via email, SMS, and WhatsApp. HIPAA-ready, end-to-end encrypted.";
  const ogDescription =
    "Booking, intake, Prep Brief, real-time SOAP notes, ICD-10, prescriptions, and follow-up — one platform for your entire OPD. HIPAA-ready.";

  return {
    title,
    description,
    keywords: KEYWORDS_IN,
    alternates: {
      canonical: `${SITE_URL}/in`,
      languages: {
        "en-IN": `${SITE_URL}/in`,
        id: `${SITE_URL}/id`,
        "x-default": `${SITE_URL}/in`,
      },
    },
    openGraph: {
      title,
      description: ogDescription,
      url: `${SITE_URL}/in`,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
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
      <DeferredWarpField className="fixed inset-0 z-0" />
      <Nav locale={l} />
      <main className="relative z-10">
        {isOpd ? <HeroIndia locale={l} /> : <Hero locale={l} />}
        <Problem locale={l} />
        <InlineCTA locale={l} variant="afterProblem" />
        {!isOpd && <HowItWorks locale={l} />}
        {isOpd ? <FeaturesIndia locale={l} /> : <Features locale={l} />}
        <InlineCTA locale={l} variant="afterDemo" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateMedicalBusinessJsonLd()),
          }}
        />
      </main>
      <Footer locale={l} />
      <MobileCTA locale={l} />
      <Toaster position="bottom-right" theme="dark" />
    </SmoothScroll>
  );
}
