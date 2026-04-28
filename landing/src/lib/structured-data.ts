import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "./metadata";
import type { FAQItem } from "@/data/faqs";
import type { BlogPost } from "@/data/blog-posts";

// Add real social URLs as they go live.
const SAME_AS: string[] = [];

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: "Larinova",
    url: SITE_URL,
    logo: `${SITE_URL}/larinova-icon.png`,
    description: SITE_DESCRIPTION,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "hello@larinova.com",
        availableLanguage: [
          "English",
          "Tamil",
          "Hindi",
          "Indonesian",
          "Javanese",
        ],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "hello@larinova.com",
        availableLanguage: ["English", "Tamil", "Hindi", "Indonesian"],
      },
    ],
    sameAs: SAME_AS,
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "Country", name: "Indonesia" },
    ],
  };
}

export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: ["en-IN", "id-ID"],
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function generateFAQPageJsonLd(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

// SoftwareApplication describing the OPD platform itself.
// Free trial is modeled via isAccessibleForFree + a free-tier Offer.
// `featureList` is what Google Knowledge Graph and AI search engines pick up
// to understand the product's actual capabilities.
export function generateSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Electronic Medical Records",
    operatingSystem: "Web, iOS, Android",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: ["en-IN", "id-ID", "ta", "hi"],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      name: "Free 1-month trial",
      price: 0,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      eligibleRegion: [
        { "@type": "Country", name: "India" },
        { "@type": "Country", name: "Indonesia" },
      ],
    },
    featureList: [
      "Online patient booking with WhatsApp confirmations",
      "AI-guided patient intake with auto follow-up for missing details",
      "Pre-consult Prep Brief generated in 60 seconds",
      "Real-time SOAP notes in Tamil, Hindi, Bahasa Indonesia, and English",
      "Automatic ICD-10 coding",
      "AI-drafted prescriptions ready for doctor sign-off",
      "Automated wellness follow-up via email, SMS, and WhatsApp",
      "Code-mixed speech recognition (Tamil+English, Hindi+English)",
      "HIPAA-ready data handling with end-to-end encryption",
    ],
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Physicians, OPD doctors, clinics, hospitals",
    },
  };
}

// Local-business style schema for the company itself, useful for India/Indonesia
// search ("OPD software near me", "platform OPD Indonesia").
export function generateMedicalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "Organization"],
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/larinova-icon.png`,
    description: SITE_DESCRIPTION,
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "Country", name: "Indonesia" },
    ],
    medicalSpecialty: "GeneralPractice",
    knowsLanguage: ["en-IN", "id-ID", "ta", "hi"],
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${SITE_URL}${post.image}`,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/larinova-icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };
}
