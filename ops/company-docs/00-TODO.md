# Larinova — Launch & Compliance TODO

**Evidence-backed.** Every ✅ below is verified against an actual PDF on disk. Every ❌ is verified as *not yet present in either inbox* as of sweep 2026-04-24.

**Company:** LARINOVA PRIVATE LIMITED · **CIN** U62012TN2026PTC192444 · incorporated **22 April 2026** · Tamil Nadu.

Legend: ⛔ blocks charging · 🔴 high · 🟡 medium · 🟢 nice-to-have

---

## ✅ Done — already on file

1. **Name reservation approved** — MCA approved `LARINOVA PRIVATE LIMITED` on 24 Mar 2026. (`03-name-approval/…MCA Name Approval.pdf`)
2. **Incorporation approved** — MCA issued Certificate of Incorporation on 22 Apr 2026. (`01-incorporation/…SPICE + Part B_Approval Letter_AC3085730.pdf`)
3. **DIN allotted to Gabriel** — DIN `11680005`. (`01-incorporation/…DIN Approval Letter_AC3085730.pdf`)
4. **MoA filed** — INC-33 post-approval on file. (`01-incorporation/…INC 33 Post Approval.pdf`)
5. **AoA filed** — INC-34 post-approval on file. (`01-incorporation/…INC 34 Post Approval.pdf`)
6. **Company PAN issued** — `AAGCL8535J`. (evidence: CoI; acknowledgement `…050109700948974_signed.pdf` / `…882052107214670_signed.pdf`)
7. **Company TAN issued** — `CHEL10203E`. (evidence: CoI; acknowledgement `…88305930153000_signed.pdf`)
8. **Statutory auditor (verbal)** — Dad's CA agreed to take it on. *Written consent letter + ADT-1 filing still required* — see ❌ below.

## ⚠️ In flight — vendor emails awaiting your response

- **BizFoc compliance quote** (`1391ABZL2`) — Janvi Arora, 23 Apr 2026. ₹20,000 + 18% GST = **₹23,600** for FY 2026-27 annual mandatory compliance package. Assumes ~₹10L turnover. **Decision already made: declining, using Dad's CA instead. Need to email Janvi to close the thread.**

## ❌ To do — in order of legal criticality

### ⛔ PHASE 1 — required before first invoice

#### 1. Open company bank account — **next 1–2 weeks**
- [x] Pick bank: **ICICI only** for Larinova's first current account.
- [ ] Ignore HDFC, Kotak, RazorpayX-as-primary, and all other inbound bank-account offers unless Gabriel explicitly changes the bank choice.
- [ ] Take to bank: `01-incorporation/…SPICE + Part B_Approval Letter_AC3085730.pdf` (CoI), `…INC 33` (MoA), `…INC 34` (AoA), director PANs + Aadhaar, registered-office address proof
- [ ] Board resolution to open account (Dad's CA can draft)
- [ ] Record IFSC + account number in `02-bank.md`
- **Blocks:** capital infusion, INC-20A, payment gateway
- **Owner:** Gabriel + Antony (both sign)

#### 2. Capital infusion — **within 60 days of incorporation (by 21 Jun 2026)**
- [ ] Confirm paid-up capital per MoA (check `01-incorporation/…INC 33…pdf`)
- [ ] Transfer **Rs. 10,000** from founders' personal accounts → company account
- [ ] Get bank statement showing the credit (needed for INC-20A)
- [ ] Issue share certificates, update register of members
- **Depends on:** #1 done

#### 3. Appoint statutory auditor + file ADT-1 — **by 22 May 2026**
- [ ] Get written **consent letter** from Dad's CA
- [ ] Get **Form ADT-1** certificate of non-disqualification from CA
- [ ] Hold Board Meeting → resolution appointing first auditor (Companies Act s.139(6))
- [ ] File ADT-1 on MCA portal
- **Hard deadline:** 30 days from 22 Apr = **22 May 2026**
- **Owner:** CA drives, you sign

#### 4. File INC-20A (Commencement of Business) — **by 19 Oct 2026**
- [ ] Bank account open (#1)
- [ ] Capital infused (#2)
- [ ] Director declaration drafted
- [ ] Bank statement showing **Rs. 10,000** paid-up capital receipt attached
- [ ] Outside registered-office photo with English/Tamil nameboard showing company name, CIN, registered-office address, email, and phone
- [ ] Inside registered-office photo with signing director
- [ ] File INC-20A, certified by practising CA/CS/CMA
- **Penalty if missed:** ₹50,000 on company + ₹1,000/day/director
- **Hard deadline:** 180 days from incorporation = **19 Oct 2026**
- **Blocks:** legally "commencing business" / issuing any commercial invoice
- **Depends on:** #1, #2

#### 5. Apply for GST registration — **before first invoice**
- [ ] Decide: voluntary registration (recommended — B2B customers need GSTIN for ITC) vs. wait for ₹20L threshold
- [ ] Gather: `CoI`, `PAN (AAGCL8535J)`, bank proof, registered office proof, director KYC, DSC
- [ ] Apply at gst.gov.in
- [ ] Aadhaar-authenticate directors
- [ ] GSTIN issued (~3–7 working days)
- [ ] Update website footer + invoice template
- **Depends on:** #1 done (bank proof required)

#### 6. Website legal pages — **before payment gateway + DPDP compliance**
- [ ] **Terms of Service** — subscription terms, SLA, governing law (Tamil Nadu), jurisdiction (Chennai)
- [ ] **Privacy Policy** — DPDP-compliant; covers medical data handling, retention, sub-processors (Sarvam, Deepgram, OpenAI, Supabase, Vercel, Cloudinary), patient rights
- [ ] **Refund & Cancellation Policy** — concrete (vague policies get rejected)
- [ ] **Contact page** with registered office address from CoI
- [ ] Footer links from larinova.com, app.larinova.com, patient.larinova.com

#### 7. Payment gateway integration
- [ ] Pick: Razorpay (recommended — fast approval since Rize did your incorp), Cashfree, Stripe India
- [ ] Submit with: GSTIN (#5), bank account (#1), website legal pages (#6), sample invoice, business description
- [ ] Healthcare triggers additional review — budget 1 week
- [ ] Integrate test keys → live keys → first test transaction on own card
- **Depends on:** #1, #5, #6

---

### 🔴 PHASE 2 — long lead times, start immediately in parallel

#### 8. Trademark "LARINOVA"
- [ ] Public search at ipindia.gov.in (Classes 9 + 44)
- [ ] File Class 9 (software / mobile apps) — ₹4,500 (Startup India pricing)
- [ ] File Class 44 (medical services) — ₹4,500
- [ ] Track examination → publication → registration (12–18 months total)
- **Why urgent:** someone else files first = you lose the brand

#### 9. Startup India / DPIIT recognition
- [ ] Apply at startupindia.gov.in (free, ~2 weeks)
- [ ] Upload: CoI, PAN, pitch deck, short innovation description
- [ ] Recognition letter received
- [ ] File for **Section 80-IAC** 3-year income tax holiday
- **Why:** 3-year 0% corporate tax, trademark discount, tenders eligibility

#### 10. Import Export Code (IEC)
- [ ] Apply at dgft.gov.in (free, usually same day)
- [ ] Share IEC number with bank (for inbound Indonesia / US forex)
- **Why:** without IEC, banks block incoming forex wire transfers for services. Indonesia revenue hits a wall.

---

### 🔴 PHASE 3 — healthcare-specific compliance posture

#### 11. DPDP Act readiness (ongoing)
- [ ] Doctor-side + patient-side recording consent flows in product
- [ ] Data retention policy written + enforced (how long are transcripts kept?)
- [ ] Deletion / data-subject-access endpoint in app
- [ ] Breach notification process
- [ ] Sub-processor list maintained (Sarvam, Deepgram, OpenAI/Anthropic, Supabase, Vercel, Cloudinary)
- [ ] DPA templates drafted for hospital customers

#### 12. Data localization review
- [ ] Supabase production DB region — should be `ap-south-1` (Mumbai) for Indian patient data
- [ ] Vercel deployment region review for app.larinova.com
- [ ] Audit vendors (Deepgram is US — flag for India-region customers)

#### 13. Insurance review
- [ ] **Existing policy #328971012** — check what it actually covers (`01-incorporation/e-Policy Document…*.pdf`). Likely directors' indemnity or office; verify scope.
- [ ] Add **Professional indemnity** (~₹1 cr) if not covered — healthcare SaaS essential
- [ ] Add **Cyber liability** (~₹50 L) — enterprise hospitals will request certificates
- **Cost:** ~₹30–60k/year combined through ICICI Lombard / Digit / Tata AIG

---

### 🟡 PHASE 4 — Indonesia market path

#### 14. Indonesia billing approach
- [ ] **Phase A (now → first 5 customers):** bill USD via Stripe/Paddle, forex to India bank account (needs IEC #10)
- [ ] **Phase B (≥5 Indonesian hospitals):** evaluate setting up **PT PMA** — 3 months + $5–8k fees
- **Defer Phase B until:** real revenue pipeline justifies it

---

### 🟡 PHASE 5 — nice-to-have, low effort

#### 15. MSME / Udyam registration
- [ ] Apply at udyamregistration.gov.in (free, instant)
- **Why:** legal protection against delayed B2B payments (45-day rule + interest), MSME credit access

#### 16. Shops & Establishment (Tamil Nadu)
- [ ] Register when hiring or moving to non-residence office (defer for now)

#### 17. Standard commercial templates
- [ ] MSA (Master Service Agreement)
- [ ] DPA (Data Processing Agreement)
- [ ] BAA (Business Associate Agreement) — for hospital customers with PHI
- [ ] NDA (mutual + one-way)
- **When:** before enterprise sales call with procurement

---

## Ongoing — annual compliance (CA handles once engaged)

| Filing | Cadence | Deadline |
|---|---|---|
| DIR-3 KYC | annual | 30 Sep |
| AOC-4 | annual | within 30 days of AGM |
| MGT-7 | annual | within 60 days of AGM |
| ITR | annual | 31 Oct (with audit) |
| Board Meetings | 4/year (1/quarter) | minutes maintained |
| AGM | 1/year | within 9 months of FY-end first year; 6 months after |
| GSTR-1, GSTR-3B | monthly (or QRMP) | after GST registration |

---

## Critical path

```
Week 1-2:  Bank account ─┬─→ Capital infusion ─┬─→ INC-20A
                         ├─→ ADT-1 (by 22 May) │
                         │                     │
                         └─→ GST registration ─┘
Parallel:  Trademark · Startup India · IEC  (start now)
Week 3-4:  Website legal pages ─→ Payment gateway
Month 2+:  Insurance, MSME, commercial templates
Month 3+:  PT PMA evaluation (if Indonesia pipeline real)
```

**Rule:** no invoice goes out until bank account + ADT-1 + INC-20A + GST are all done. Everything else (trademark, IEC, Startup India) can run in parallel but doesn't block revenue.

## Email drafts to send

1. **To Janvi @ BizFoc** — declining the ₹23,600 compliance quote, thanking them for incorporation.
2. **To Dad's CA** — formal confirmation to proceed with auditor appointment, ADT-1 filing by 22 May, and ongoing FY 2026-27 compliance.
3. **To Dad (antony@raxgbc.co.in)** — status summary + folder share + compliance timeline.
