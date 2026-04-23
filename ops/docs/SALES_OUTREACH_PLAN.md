# Larinova — Indonesia Sales & Outreach Plan

**Date:** April 12, 2026
**Status:** Active — Execute immediately
**Author:** Gabriel Antony Xaviour

---

## 1. The Problem: Messaging Is Fragmented

Right now, a doctor encounters different offers depending on where they look:

| Touchpoint | Current Offer | Problem |
|------------|--------------|---------|
| Landing page hero CTA | "Start Free Trial — 14 days free" | Short, feels transactional |
| Landing page pricing section | "Rp 0 selama 14 hari, 50 consultations" | Caps usage, creates anxiety |
| Discovery survey (web) | "Submit & Get 1 Month Free" | Contradicts the 14-day messaging |
| Discovery form (PDF, EN) | "1 MONTH FREE — Fill this form & get full access" | Different from landing page |
| Discovery form (PDF, ID) | "GRATIS 1 BULAN — Isi form & dapatkan akses penuh" | Different from landing page |
| MVP app billing page | "Forever Free" with "3 AI generations" | Confusing — is it free forever or a trial? |
| MVP app backend | Actually allows 50 free uses | Doesn't match the "3" shown in UI |
| Upgrade modal | "You've used all {limit} free trials" | Says "free trials" — plural and vague |

**A doctor who sees "14 days free" on the website, then "1 month free" on the survey, then "3 free uses" in the app will not trust you.**

---

## 2. The Decision: Standardize on 1 Month Free, Full Access

**The offer everywhere, no exceptions:**

> **Gratis 1 bulan penuh. Semua fitur. Tanpa kartu kredit.**
> (1 full month free. All features. No credit card.)

**Why 1 month, not 14 days:**

- Doctors are busy — it takes 2-3 weeks to integrate a new tool into daily workflow
- You need them to use it long enough to form a habit and see compounding value
- You need 3+ days of real usage before asking for a testimonial — 14 days leaves almost no buffer
- The discovery forms (your IRL handout) already promise 1 month — changing those PDFs is harder than changing website copy
- At this stage you need usage data and testimonials, not revenue. One genuine testimonial is worth more than a month of subscription fees
- "1 month free" is a stronger psychological anchor than "14 days" in cold outreach

**What happens after 1 month:**

- Doctor keeps free tier (real-time transcription + patient management, unlimited)
- AI features (SOAP notes, medical codes, MedicalGPT) require Pro plan
- Pro pricing for Indonesia: show "Coming Soon — early adopter pricing" until you have 10+ active users, then set price based on willingness-to-pay data from those users

---

## 3. Changes Required Across All Touchpoints

### Landing Page (`landing/src/data/locale-content.ts`)

| Element | Change From | Change To |
|---------|------------|-----------|
| Hero CTA | "Mulai Uji Coba Gratis" | "Coba Gratis 1 Bulan" |
| Mobile CTA | "Mulai Uji Coba Gratis - 14 hari gratis" | "Coba Gratis 1 Bulan — Semua Fitur" |
| Pricing free tier | "Rp 0 selama 14 hari" / "50 consultations" | "Rp 0 selama 1 bulan" / "Akses penuh semua fitur" |
| Nav CTA | "Start Free Trial" | "Try Free for 1 Month" |
| Discovery survey success | Keep as-is (already says 1 month) | No change needed |

### MVP App — Billing UI (`messages/id.json` + `messages/in.json`)

| Element | Change From | Change To |
|---------|------------|-----------|
| Free tier name | "Gratis selamanya" / "Forever Free" | "Uji Coba 1 Bulan" / "1 Month Trial" |
| AI limits display | "3 pembuatan ringkasan AI" | "Tak terbatas selama uji coba" / "Unlimited during trial" |
| Upgrade modal | "You've used all {limit} free trials" | Remove — during trial month, everything is unlimited |

### MVP App — Backend (`types/billing.ts`)

| Element | Change From | Change To |
|---------|------------|-----------|
| `FREE_TIER_LIMITS` | `{ summary: 50, medical_codes: 50, helena_chat: 50 }` | Set to unlimited (e.g., 999999) for first 30 days after signup, then revert to limited free tier |

### Discovery Forms (PDFs)

| Element | Status |
|---------|--------|
| EN form | Already says "1 MONTH FREE" — no change needed |
| ID form | Already says "GRATIS 1 BULAN" — no change needed |
| Footer domain | Shows "larinova.id" — regenerate with "larinova.com" when convenient |

---

## 4. Today's Doctor Meeting — Playbook

### Before the Meeting

- [ ] Ensure the MVP app is running and accessible on your phone/laptop
- [ ] Have the discovery form (ID version) printed or ready as PDF on tablet
- [ ] Prepare a demo patient record to show during walkthrough
- [ ] Have your own WhatsApp ready to add her as a contact

### During the Meeting (30-45 min)

**Phase 1 — Build rapport (5 min)**
Don't pitch immediately. Ask about her practice, how many patients she sees daily, what software she currently uses. Listen for pain points.

**Phase 2 — Show the problem (5 min)**
"Berapa lama biasanya menulis catatan konsultasi per pasien?" (How long does writing consultation notes usually take per patient?)
Let her quantify her own pain. If she says 5-10 minutes per patient × 15 patients = 75-150 minutes/day of paperwork, that's your hook.

**Phase 3 — Live demo (10-15 min)**
Don't walk through features. Do a mock consultation:
1. Start a recording
2. Speak naturally in Bahasa Indonesia (play doctor-patient conversation)
3. Show the SOAP note generated automatically
4. Show the prescription generated
5. Show how patient records are organized

Let her react. Her facial expression when the SOAP note appears is your signal.

**Phase 4 — Hand her the app (5 min)**
"Mau coba sendiri? Gratis 1 bulan penuh, semua fitur." (Want to try it yourself? Free for 1 full month, all features.)
Help her sign up right there. Walk through onboarding together.

**Phase 5 — Discovery survey (5 min)**
"Sebelum lupa, boleh isi form singkat ini? Cuma 2 menit — ini bantu kami bikin Larinova lebih cocok untuk dokter Indonesia."
(Before we forget, could you fill this short form? Just 2 minutes — this helps us make Larinova better for Indonesian doctors.)
Hand her the printed PDF or tablet.

**Phase 6 — Plant the testimonial seed (2 min)**
Don't ask for a testimonial today. Instead say:
"Kalau setelah 3-4 hari pakai dan kamu suka, boleh nggak aku minta video singkat 30 detik — cuma cerita pengalamanmu? Buat bantu dokter lain tahu soal Larinova."
(If after 3-4 days of using it you like it, can I ask for a short 30-second video — just share your experience? To help other doctors know about Larinova.)

This is a soft commitment, not a hard ask. She'll feel obligated because you gave her 1 month free.

### After the Meeting

**Day 0 (today):** Send WhatsApp message thanking her. Include a link to the app.

> "Hai Dok, senang ketemu tadi! Ini link Larinova-nya: [app link]. Kalau ada pertanyaan, langsung WhatsApp aku ya. Selamat mencoba!"

**Day 1-2:** Don't message. Let her use it naturally.

**Day 3:** Check in casually on WhatsApp.

> "Hai Dok, gimana Larinova-nya? Ada yang bingung atau butuh bantuan?"

**Day 4-5:** If she's been using it (check your dashboard), ask for the testimonial.

> "Dok, aku lihat kamu sudah pakai Larinova beberapa hari. Boleh minta tolong rekam video singkat 30-60 detik — cerita aja pengalamanmu pakai Larinova? Bisa dari HP, santai aja. Ini sangat membantu buat dokter lain yang masih ragu."

**Give her a simple prompt if she asks what to say:**
1. Nama dan spesialisasi
2. Masalah apa yang dulu kamu hadapi dengan catatan pasien?
3. Gimana Larinova membantu?
4. Apa yang paling kamu suka?

---

## 5. Cold Outreach Strategy (Post-Testimonial)

### Leads Overview

You have ~50 cold leads in `indonesia_leads.xlsx` — major Indonesian hospitals (government and private) across Jakarta and other cities. Most have email addresses; a few have WhatsApp numbers. These are institutional contacts (hospital admin/PR), not individual doctors.

### Outreach Approach: WhatsApp First, Email Second

**Why WhatsApp first:**
- Indonesia's primary business communication channel
- Higher open rate than email (90%+ vs 20-30%)
- Personal, conversational, low-friction
- The discovery form already collects WhatsApp numbers

**Problem:** Most of your cold leads don't have WhatsApp numbers — they have hospital phone numbers and institutional emails. This means:

- **For leads with WhatsApp numbers (few):** WhatsApp directly
- **For leads with email only:** Email first → ask for WhatsApp in the CTA
- **For leads with only phone/web forms:** Skip for now, focus on email-reachable leads

### WhatsApp Template (for leads with WhatsApp)

> Halo, saya Gabriel dari Larinova — platform AI untuk membantu dokter Indonesia menulis catatan konsultasi secara otomatis.
>
> [TESTIMONIAL VIDEO]
>
> Dr. [Name] sudah pakai Larinova dan hemat 1-2 jam sehari dari pekerjaan administrasi.
>
> Kami ingin tahu apakah tim dokter di [Hospital Name] juga mengalami masalah yang sama dengan dokumentasi pasien?
>
> Kalau tertarik, kami kasih akses GRATIS 1 BULAN penuh untuk dicoba. Tanpa kartu kredit, tanpa komitmen.
>
> Boleh saya kirim info lebih lanjut?

### Email Template (for institutional contacts)

**Subject:** Dokter Indonesia hemat 2 jam/hari — Larinova AI Medical Scribe

> Kepada Yth. Tim [Hospital Name],
>
> Saya Gabriel dari Larinova, platform AI yang membantu dokter Indonesia menulis catatan konsultasi, resep, dan surat rujukan secara otomatis — langsung dari percakapan dalam Bahasa Indonesia.
>
> Rata-rata dokter menghabiskan 2+ jam sehari untuk administrasi. Dengan Larinova, dokter tinggal bicara dengan pasien — catatan SOAP, kode ICD-10, dan resep langsung dibuat otomatis.
>
> [Link ke testimonial video atau landing page]
>
> Kami menawarkan akses GRATIS 1 BULAN penuh untuk dokter di [Hospital Name] — tanpa kartu kredit, tanpa komitmen. Sepenuhnya dalam Bahasa Indonesia.
>
> Apakah ada waktu minggu ini untuk demo singkat 15 menit via video call? Atau jika lebih mudah, bisa reply email ini atau WhatsApp saya di [your number].
>
> Salam,
> Gabriel Antony Xaviour
> Founder, Larinova
> hello@larinova.com
> [WhatsApp number]

### Outreach Sequence

| Day | Action | Channel |
|-----|--------|---------|
| Day 1 | Send initial outreach | Email or WhatsApp |
| Day 3 | Follow up if no reply | Same channel |
| Day 7 | Second follow-up with different angle (share a specific pain point stat) | Same channel |
| Day 14 | Final follow-up — "Just checking if this is relevant" | Same channel |
| After Day 14 | Move to nurture list — re-engage in 1 month | — |

### Key Rule: Don't Start Cold Outreach Until You Have the Testimonial

The testimonial video transforms your message from "unknown startup asking for your time" to "a real Indonesian doctor vouching for this tool." Wait for it.

---

## 6. Metrics to Track

| Metric | Target (Month 1) |
|--------|------------------|
| Doctors signed up | 5-10 |
| Active daily users (used in last 7 days) | 3-5 |
| Consultations recorded | 50+ |
| Testimonial videos collected | 1-2 |
| Cold outreach sent | 30-40 |
| Reply rate | 10-15% |
| Demo meetings booked | 3-5 |

---

## 7. What NOT to Do

- **Don't offer different things in different places.** One offer: 1 month free, full access, no credit card. Everywhere.
- **Don't ask for the testimonial on Day 1.** Let her experience the product first. Day 3-5 minimum.
- **Don't send cold outreach without the testimonial.** The conversion difference is massive.
- **Don't email and WhatsApp the same lead simultaneously.** Pick one channel per lead.
- **Don't pitch features.** Pitch time saved. "2 jam sehari kembali ke pasien Anda" (2 hours a day back to your patients).
- **Don't discount or negotiate pricing yet.** You don't even have pricing for Indonesia. The 1-month free trial IS your entire offer right now.
