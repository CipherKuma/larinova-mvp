# Larinova — Combined Audit

**Date:** 2026-04-18  
**Scope:** Post-merge sweep — M4 Pro (landing, mvp-web-app, docs/, sales/) + M2 Pro (12 root-level Indonesian assets)  
**Status:** Two-laptop sync resolved; repo is now `larinova-workspace` on GitHub.

---

## Executive Summary

1. **Mid-Clinic pitch PDFs quote the wrong price** — IDR 399K is the Solo tier. A 5-10 doctor clinic is the Pro tier at IDR 899K. Fix before the next hospital visit.
2. **Discovery form bugs** — EN page 2 says "Halaman 2 dari 2"; both forms use "Clinic Management & AI Platform" tagline instead of "AI Medical Scribe for Doctors."
3. **Indonesian HTML outreach tools have unfilled placeholders** — the demo video link, sign-up URL, WhatsApp number, and email address are all `[placeholder]` or `href="#"` across the presentation, email, and WA templates. These must be filled before any outreach.
4. **Midwifery segment has deep research but no outreach materials** — decide: active segment now or future roadmap? The current materials (WA templates, email, presentation, discovery forms) are entirely doctor-focused.
5. **The Sigda Optima spec (`docs/SIGDA_OPTIMA_FORM_SPEC.md`) is the most valuable document in the project** — 468 lines of real Puskesmas field analysis. Protect it.

---

## Per-Document Findings

### Strategy docs (`docs/`)

**`SALES_OUTREACH_PLAN.md`** — Strong. Phase 1-6 playbook is tight; "no cold outreach until testimonial" rule is correct. One mismatch: the leads list is institutional-heavy (info@, yanmedrs@) but the plan assumes WhatsApp-first. You'll end up email-first by default.

**`PRICING_IMPLEMENTATION_INSTRUCTIONS.md`** — Best-in-class as a gated future-work doc. Keep the "wait for 10+ active users" gate. The 17% annual discount is uniformly applied across all tiers — real SaaS discounts vary by tier, but this is a minor polish issue.

**`Competitive_Research_Report.html`** — Well-researched. "No native Bahasa Indonesia AI scribe in production today" is the sharpest positioning claim. Lead with language, not price (being cheaper than Nuance is irrelevant in a Jakarta hospital pitch).

**`SIGDA_OPTIMA_FORM_SPEC.md`** — 468-line reverse-engineered EMR spec from a Puskesmas video analysis. The "which fields can AI extract from voice" table is the best product-insight artifact in the project. Keep and version-control carefully.

**`CLAUDE_CODE_PROMPT.md`** — One-shot implementation prompt that did its job April 12. Move to `docs/archive/` or delete.

---

### Pitch decks (`sales/pitch-decks/`)

**Mid-Clinic EN + ID** — **High severity.** Target audience is "5-10 doctors" but pricing footer says IDR 399K (the Solo/Basic tier). Pro tier for 5-10 doctors is IDR 899K. A clinic will hold you to IDR 399K if they see this.

**All ID versions** — Comparison table header row left in English: "Feature / Manual / With Larinova." Fix to: "Fitur / Manual / Dengan Larinova."

**All 6 decks** — No product screenshot. Fine for an in-person leave-behind. For cold digital outreach, one image of a real Bahasa Indonesia SOAP note would do more work than any bullet.

---

### Discovery forms

**EN form** — "Halaman 2 dari 2" on page 2 (Indonesian page label on English version). Tagline says "Clinic Management & AI Platform for Indonesian Doctors" — should be "AI Medical Scribe for Doctors."

**ID form** — Same tagline mismatch. Uses informal "kamu" throughout — appropriate for warm meetings with younger doctors, potentially too casual for senior doctors or hospital administrators. Consider an "Anda" variant.

**M2 Pro vs M4 Pro comparison** — Both laptops had distinct PDF pairs (different md5s). Compare before deleting: pick the version with the cleaner layout, correct tagline, and no "Halaman" bug.

---

### Indonesian HTML outreach tools (root level → moving to `sales/indonesia/outreach-tools/`)

**`Presentasi Larinova.html`** — Genuinely impressive: 12-slide interactive deck, Web Speech API narration, keyboard nav, professional dark navy/teal design. Issues: (1) Slide 9 says 5 approach steps, CLAUDE.md says 7 — fix the mismatch. (2) "Untuk dokter Indonesia, oleh teknologi Indonesia" locks the brand to Indonesia — if India expansion happens, needs a separate version. (3) No mention of midwifery segment.

**`Larinova_Pricing_Page_Mockup.html`** — Solid. The 4-tier IDR structure (149K → 2.499M) matches the market analysis. One math bug: monthly view shows "= IDR 1,490,000/tahun" for Starter (149K × 10), but monthly × 12 = 1,788,000. The 1,490K figure is the annual-plan price — it shouldn't appear in the monthly view. Nav and CTA buttons have no real links.

**`email_larinova_template.html`** — Good structure. Color mismatch: email uses blue (#1a6ee8), presentation and pricing page use teal (#00B8A9 / #2E6DA4). To a doctor receiving both, these look like different products. Standardize on teal. All links are `href="#"`. No mobile media query — most Indonesian doctors will open on mobile.

**`whatsapp_templates.html`** — Excellent. 6 templates covering the full outreach sequence, phone frame mockups, one-click copy. Template 3 still has `[LINK VIDEO DI SINI]` — fill in the real video URL.

---

### Research docs (root level → moving to `sales/indonesia/research/`)

**`Larinova_Analisis_Harga_Pasar.xlsx`** — Most analytically rigorous doc. ROI numbers are powerful: solo doctor saves IDR 9.75M/month, costs IDR 149K = 65x ROI. Small clinic: 147x ROI. Use these in outreach. Issues: "15 min saved per patient" assumption is unvalidated — one skeptical doctor could undermine the whole pitch. "Data Pasar Indonesia" sheet is duplicated in the workbook.

**`Larinova_LENGKAP_FINAL.xlsx`** — 51 hospitals/clinics (identical content to `sales/indonesia_leads.xlsx`; root copy deleted). Problem: list is institutional (large hospitals, chains) but current strategy targets solo practitioners and small clinics. No CRM columns (Contact Date / Channel / Response / Status / Next Action). **48/51 rows have WhatsApp field as "-"** — critical gap since WA is the primary outreach channel. No individual names — "Siloam Kebon Jeruk" is not a lead; the medical director there is.

**`Riset_Pasar_Kebidanan_Larinova_v2.docx`** — Solid midwifery market research: 300K+ registered midwives, mandatory forms (ANC, Partograf, Nifas, Immunization), SATUSEHAT/BPJS regulatory hooks. Section 5 ("Rekomendasi Fitur") exists in the table of contents but the content is blank — fill it in.

**`Laporan_Feedback_Kebidanan_Larinova.docx`** — ~70% overlap with the v2 research report (Elisa interview + earlier findings). Consolidate into the v2 doc and delete this one.

**`Midwifery_Market_Opportunity_Gabriel.pptx`** — Best strategic document for investor/partner pitches. SATUSEHAT regulatory urgency angle converts "nice to have" to "must have." Issues: "<5% midwives using digital records" needs a citation. All Larinova columns labeled "proposed" — accurate but signals the features don't exist yet.

---

### App code

**`mvp-web-app/types/billing.ts`** — `PLAN_PRICES` has only `IN` (INR) and `default` (USD). No IDR. If an Indonesian doctor hits the billing page, they see USD. Fine in Month 1 (free-trial only). Handle when the pricing page ships per `PRICING_IMPLEMENTATION_INSTRUCTIONS.md`.

**`landing/` hero** — Claims "22+ Indian languages spoken in consultations" but feature tags show only Tamil · Hindi · English. If you support 3, say 3.

**`landing/README.md`** — Still the default `create-next-app` boilerplate.

**`landing/docs/india-launch-design.md`** — March 18 doc still references "Start Free Trial" CTAs, which were standardized to "Try Free for 1 Month" on April 12. Mark as superseded or update.

---

## Action Items

### Urgent — fix before next doctor meeting

- [ ] Regenerate `Larinova_Pitch_Mid_Clinic_EN.pdf` and `_ID.pdf` with IDR 899K (Pro tier, 5-10 doctors)
- [ ] Regenerate all 3 ID pitch PDFs with translated headers ("Fitur / Manual / Dengan Larinova")
- [ ] **Discovery form EN (`sales/discovery-forms/discovery_form_en.pdf`):** footer still says `larinova.id` — update to `larinova.com` and regenerate
- [ ] **Both discovery forms (EN + ID):** tagline says "Clinic Management & AI Platform for Indonesian Doctors" / "Platform Manajemen Klinik & AI" — change to "AI Medical Scribe for Doctors" / "Penulis Medis AI untuk Dokter" to match current positioning
- [ ] Fill placeholder links: demo video URL, sign-up URL, WhatsApp number, email — across presentation, email template, WA templates

### High — before cold outreach

- [ ] Fix email template color to match teal palette (#00B8A9)
- [ ] Add CRM columns to `Larinova_LENGKAP_FINAL.xlsx`: Contact Date / Channel / Response / Status / Next Action
- [ ] Fix `Larinova_Pricing_Page_Mockup.html` monthly view math (remove annual-plan price from monthly view)
- [ ] Fill Section 5 ("Rekomendasi Fitur") in `Riset_Pasar_Kebidanan_Larinova_v2.docx`
- [ ] Consolidate two midwifery docx files into one; delete `Laporan_Feedback_Kebidanan_Larinova.docx`

### Medium — this month

- [ ] Validate the "15 min saved per patient" assumption with at least one real data point from a pilot doctor
- [ ] Fix hero stat: "22+ Indian languages" → the real number Sarvam supports for medical-grade STT
- [ ] Edit `Larinova_Launch_Playbook.docx` — remove two completed action items (CLAUDE.md empty, larinova.id footer)
- [ ] Replace `landing/README.md` with real project info
- [ ] Mark `landing/docs/india-launch-design.md` as superseded
- [ ] Fix duplicate "Data Pasar Indonesia" sheet in `Larinova_Analisis_Harga_Pasar.xlsx`
- [ ] Strategic decision: midwifery segment — active now or future roadmap?

### Low — nice to have

- [ ] Add specialist column to ROI table (higher-end doctor time value for cardiologist/dermatologist)
- [ ] Add midwife/bidan-specific discovery form and WA template variants
- [ ] Verify `hello@larinova.com` SPF/DKIM/DMARC in Resend before cold outreach
- [ ] Consider a mobile media query for `email_larinova_template.html`

---

*Source: M4 Pro audit (AUDIT_2026-04-18.md) + M2 Pro audit (Larinova_Project_Audit_April2026.md), merged post-consolidation.*
