# Pricing Implementation Instructions

**Purpose**: This document contains exact instructions for updating the Larinova website from "free trial only" to full tiered pricing with competitor comparisons. DO NOT implement these changes yet — wait until you have 10+ active users and at least 1 testimonial. When the time comes, paste the relevant section into Claude Code.

**When to implement**: Month 2-3 of Indonesia launch, after validating product-market fit.

---

## Part 1: Update `locale-content.ts` — Replace Single Free Tier with Tiered Pricing

### Current state (as of April 2026):
The pricing section in `landing/src/data/locale-content.ts` has 2 tiers: `free` and `pro`. The `pro` tier for Indonesia says "Segera Hadir" (Coming Soon).

### Target state:
Replace with 4 tiers: Starter, Basic, Pro (popular), Business. Add an Enterprise banner below.

### Changes to `LandingContent` type (near top of file):

```typescript
// Replace the existing PricingTier and pricing section in LandingContent

export interface PricingTier {
  name: string;
  badge?: string;
  subtitle: string;
  price: string;
  originalPrice?: string;
  period: string;
  perUnit?: string;       // NEW: e.g., "per month · 1 doctor"
  annualNote?: string;    // NEW: e.g., "= IDR 1,490,000/year"
  features: string[];
  cta: string;
  ctaLink: string;        // NEW: actual URL
  popular?: boolean;      // NEW: highlight this tier
}

// In LandingContent, replace the pricing block:
pricing: {
  sectionLabel: string;
  headlinePre: string;
  headlineAccent: string;
  toggleMonthly: string;      // NEW
  toggleAnnual: string;       // NEW
  annualSaveBadge: string;    // NEW
  tiers: PricingTier[];       // NEW: array instead of free/pro
  enterprise: {               // NEW
    tag: string;
    title: string;
    description: string;
    features: string[];
    cta: string;
    ctaLink: string;
  };
};
```

### Indonesia locale pricing data (`id` locale):

```typescript
pricing: {
  sectionLabel: "Harga",
  headlinePre: "Harga yang",
  headlineAccent: "Transparan",
  toggleMonthly: "Bulanan",
  toggleAnnual: "Tahunan",
  annualSaveBadge: "Hemat 17%",
  tiers: [
    {
      name: "Starter",
      subtitle: "Dokter Solo",
      price: "149.000",         // Monthly IDR
      period: "per bulan",
      perUnit: "1 dokter",
      annualNote: "= IDR 1.490.000/tahun",
      features: [
        "AI Scribe — catatan konsultasi otomatis",
        "Rekam medis pasien",
        "Dokumen otomatis (resep, surat rujukan)",
        "Bahasa Indonesia penuh",
        "Tidak perlu kartu kredit",
      ],
      cta: "Mulai Gratis",
      ctaLink: "https://app.larinova.com",
    },
    {
      name: "Basic",
      subtitle: "Klinik Kecil",
      price: "399.000",
      period: "per bulan",
      perUnit: "hingga 4 dokter",
      annualNote: "= IDR 3.990.000/tahun",
      features: [
        "Semua fitur Starter",
        "Manajemen multi-dokter",
        "Laporan operasional klinik",
      ],
      cta: "Mulai Gratis",
      ctaLink: "https://app.larinova.com",
    },
    {
      name: "Pro",
      badge: "Paling Populer",
      subtitle: "Klinik Menengah",
      price: "899.000",
      period: "per bulan",
      perUnit: "hingga 10 dokter",
      annualNote: "= IDR 8.990.000/tahun",
      popular: true,
      features: [
        "Semua fitur Basic",
        "Analitik lanjutan & dashboard",
        "Priority customer support",
      ],
      cta: "Mulai Gratis",
      ctaLink: "https://app.larinova.com",
    },
    {
      name: "Business",
      subtitle: "Klinik Utama",
      price: "2.499.000",
      period: "per bulan",
      perUnit: "hingga 25 dokter",
      annualNote: "= IDR 24.990.000/tahun",
      features: [
        "Semua fitur Pro",
        "Multi-lokasi & multi-cabang",
        "Onboarding & pelatihan tim",
        "Dedicated account manager",
      ],
      cta: "Mulai Gratis",
      ctaLink: "https://app.larinova.com",
    },
  ],
  enterprise: {
    tag: "Enterprise",
    title: "Rumah Sakit & Jaringan Klinik Besar",
    description: "Untuk RS, jaringan klinik >25 dokter, atau institusi yang butuh kustomisasi penuh.",
    features: ["Unlimited dokter", "Integrasi HIS/EMR", "SLA & support 24/7", "Harga kustom"],
    cta: "Hubungi Kami",
    ctaLink: "mailto:hello@larinova.com",
  },
},
```

### India locale pricing data (`in` locale):

```typescript
pricing: {
  sectionLabel: "Pricing",
  headlinePre: "Transparent",
  headlineAccent: "Pricing",
  toggleMonthly: "Monthly",
  toggleAnnual: "Annual",
  annualSaveBadge: "Save 17%",
  tiers: [
    {
      name: "Starter",
      subtitle: "Solo Doctor",
      price: "999",              // Monthly INR
      period: "/month",
      perUnit: "1 doctor",
      annualNote: "= ₹9,990/year",
      features: [
        "AI Scribe — automatic consultation notes",
        "Patient records",
        "Auto documents (prescriptions, referrals)",
        "Tamil + Hindi + English",
        "No credit card required",
      ],
      cta: "Start Free",
      ctaLink: "https://app.larinova.com",
    },
    {
      name: "Basic",
      subtitle: "Small Clinic",
      price: "2,499",
      period: "/month",
      perUnit: "up to 4 doctors",
      annualNote: "= ₹24,990/year",
      features: [
        "All Starter features",
        "Multi-doctor management",
        "Clinic operational reports",
      ],
      cta: "Start Free",
      ctaLink: "https://app.larinova.com",
    },
    {
      name: "Pro",
      badge: "MOST POPULAR",
      subtitle: "Growing Clinic",
      price: "4,999",
      period: "/month",
      perUnit: "up to 10 doctors",
      annualNote: "= ₹49,990/year",
      popular: true,
      features: [
        "All Basic features",
        "Advanced analytics & dashboard",
        "Priority customer support",
      ],
      cta: "Start Free",
      ctaLink: "https://app.larinova.com",
    },
    {
      name: "Business",
      subtitle: "Large Clinic",
      price: "14,999",
      period: "/month",
      perUnit: "up to 25 doctors",
      annualNote: "= ₹1,49,990/year",
      features: [
        "All Pro features",
        "Multi-location & branches",
        "Onboarding & team training",
        "Dedicated account manager",
      ],
      cta: "Start Free",
      ctaLink: "https://app.larinova.com",
    },
  ],
  enterprise: {
    tag: "Enterprise",
    title: "Hospitals & Large Clinic Networks",
    description: "For hospitals, clinic chains with 25+ doctors, or institutions needing full customization.",
    features: ["Unlimited doctors", "HIS/EMR integration", "SLA & 24/7 support", "Custom pricing"],
    cta: "Contact Us",
    ctaLink: "mailto:hello@larinova.com",
  },
},
```

### Annual pricing (for the toggle):

| Tier | Monthly (IDR) | Annual/month (IDR) | Annual total (IDR) | Savings |
|------|---------------|--------------------|--------------------|---------|
| Starter | 149,000 | 123,000 | 1,476,000 | 17% |
| Basic | 399,000 | 331,000 | 3,972,000 | 17% |
| Pro | 899,000 | 746,000 | 8,952,000 | 17% |
| Business | 2,499,000 | 2,074,000 | 24,888,000 | 17% |

---

## Part 2: Rebuild the Pricing Component

### File: `landing/src/components/Pricing.tsx`

The current component renders 2 cards (free + pro) in a 2-column grid. It needs to be rebuilt to:

1. Show a **monthly/annual toggle** at the top
2. Display **4 pricing cards** in a responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile)
3. Highlight the **popular** tier (elevated, different color)
4. Show an **Enterprise banner** below the cards
5. All CTA buttons must link to `https://app.larinova.com` with `target="_blank"` and `rel="noopener noreferrer"`

Key implementation notes:
- Use `useState` for the monthly/annual toggle
- Multiply/divide prices client-side or store both in the data
- The "popular" card should have a contrasting dark background (like `TEAL_DARK`) with white text
- Use the existing design language (rounded corners, subtle shadows, clean typography)
- Reference the uploaded pricing mockup HTML file at `Larinova_Pricing_Page_Mockup.html` in the project root for visual design reference

---

## Part 3: Add Price Comparison Section (Optional — implement only when you have testimonials)

### When to add this:
Only after you have at least 1 testimonial and 10+ active users. A comparison without social proof looks like overcompensation.

### What to show:
Add a section BELOW the pricing cards titled "How Larinova Compares" (Indonesian: "Perbandingan Larinova").

```typescript
// Add to LandingContent type
priceComparison: {
  headline: string;
  competitors: {
    name: string;
    price: string;
    language: string;
    market: string;
  }[];
  larinovaHighlight: string;
};
```

### Data (Indonesia locale):

```typescript
priceComparison: {
  headline: "Perbandingan dengan Solusi Lain",
  competitors: [
    { name: "Nuance DAX", price: "$369-830/bulan", language: "Inggris saja", market: "AS" },
    { name: "Suki AI", price: "$299-399/bulan", language: "Inggris saja", market: "AS" },
    { name: "Freed AI", price: "$39-99/bulan", language: "Inggris saja", market: "AS" },
    { name: "Klinik Pintar", price: "Rp 1-3 Juta/bulan", language: "Indonesia", market: "Indonesia (tanpa AI scribe)" },
  ],
  larinovaHighlight: "Larinova: mulai Rp 149.000/bulan — satu-satunya AI scribe native Bahasa Indonesia",
},
```

### Design:
- Simple comparison table: Competitor | Price | Language | Market
- Larinova row at the bottom, highlighted in green/teal
- Keep it factual, not aggressive. No "we're better than X" language.

---

## Part 4: Update `app/types/billing.ts`

### Current state:
```typescript
FREE_TIER_LIMITS = { summary: 10000, medical_codes: 10000, helena_chat: 10000 }
PLAN_PRICES = {
  IN: { monthly: 1500, yearly: 15000, currency: "INR" },
  default: { monthly: 20, yearly: 200, currency: "USD" },
}
```

### Target state:
```typescript
export const PLAN_TIERS = {
  ID: {
    starter:  { monthly: 149000, yearly: 1476000, currency: "IDR", maxDoctors: 1 },
    basic:    { monthly: 399000, yearly: 3972000, currency: "IDR", maxDoctors: 4 },
    pro:      { monthly: 899000, yearly: 8952000, currency: "IDR", maxDoctors: 10 },
    business: { monthly: 2499000, yearly: 24888000, currency: "IDR", maxDoctors: 25 },
  },
  IN: {
    starter:  { monthly: 999, yearly: 9990, currency: "INR", maxDoctors: 1 },
    basic:    { monthly: 2499, yearly: 24990, currency: "INR", maxDoctors: 4 },
    pro:      { monthly: 4999, yearly: 49990, currency: "INR", maxDoctors: 10 },
    business: { monthly: 14999, yearly: 149990, currency: "INR", maxDoctors: 25 },
  },
};

// Keep FREE_TIER_LIMITS high during launch
export const FREE_TRIAL_DURATION_DAYS = 30;
export const FREE_TIER_LIMITS = { summary: 10000, medical_codes: 10000, helena_chat: 10000 };
```

---

## Part 5: Update the MVP App Billing Page

### File: `app/app/[locale]/(protected)/settings/billing/BillingClient.tsx`

The current billing page has a "Coming Soon" overlay. When implementing tiered pricing:

1. Remove the "Coming Soon" overlay
2. Show the user's current plan (Free Trial → with expiry date)
3. Show upgrade options with the tiered pricing
4. Integrate a payment provider (Xendit recommended for Indonesia, Razorpay for India)
5. Show usage stats (consultations this month, etc.)

**Payment provider recommendation for Indonesia:**
- **Xendit** — Indonesian payment gateway, supports bank transfer, e-wallets (GoPay, OVO, Dana), credit cards
- Alternative: **Midtrans** (Stripe-like for Indonesia)
- For India: keep **Razorpay** (already referenced in codebase)

---

## Part 6: Verification Checklist

After implementing, verify:

1. `grep -r "Segera Hadir" landing/src/` — should only appear if you want "Coming Soon" on some tiers
2. `grep -r 'href="#"' landing/src/components/Pricing.tsx` — should be ZERO (no dead links)
3. All CTA buttons link to `https://app.larinova.com`
4. Monthly/annual toggle works correctly, prices update
5. Mobile responsive: 1 column on phones, 2 on tablets, 4 on desktop
6. Enterprise "Hubungi Kami" links to `mailto:hello@larinova.com`
7. `types/billing.ts` — prices match what's on the landing page
8. The free trial (1 month, all features) still works as the entry point for ALL tiers

---

## Timeline Recommendation

| When | Action |
|------|--------|
| Month 1 (NOW) | Keep "1 month free" only. No pricing page. |
| Month 2 | If 10+ active users: implement tiered pricing (Parts 1-4) |
| Month 3 | If testimonials collected: add competitor comparison (Part 3) |
| Month 3-4 | Integrate payment provider (Part 5) |
| Month 4+ | Enable actual billing |

Save this file. When you're ready to implement, paste the relevant Part into Claude Code.
