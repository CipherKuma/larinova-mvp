# Larinova — Go-to-Market Strategy

**Owner:** Gabriel Antony Xaviour
**Last updated:** 2026-04-18
**Status:** Draft v1 — living doc, reviewed monthly

---

## 1. Snapshot

Larinova is an AI medical scribe + full-stack clinical management platform. Primary market: **Indonesia** (180k+ doctors, no AI scribe competitor). Parallel market: **India** (1.1M doctors, Eka.Care is the only AI competitor — English/Hindi only).

**Founder-led, agent-augmented, bootstrap.**

### Targets (conservative plan)
| Horizon | Indonesia (Jakarta only) | India (Chennai only) | Combined |
|---|---|---|---|
| Month 1 | 10 activated / 25 signed up | 10 activated / 25 signed up | 20 act / 50 sign |
| Day 90 | 75 activated / 200 signed | 75 activated / 200 signed | 150 act / 400 sign |
| Year 1 | 400–700 activated | 500–1,000 activated | 900–1,700 act |

**Stretch north star:** 10,000 per country by Year 1. Revisit monthly — if warm channels fire and referral loop kicks in, we accelerate.

**Geographic discipline:** Chennai (India) and Jakarta (Indonesia) are the ONLY cities we target through Day 90. Both are home-advantage cities — Gabriel has network in Chennai (Tamil) and direct access to Jakarta doctors in person. Other cities in both countries are explicitly deferred until these two hit proof. Saying no to a Coimbatore lead or a Surabaya lead is a feature, not a bug — it keeps the playbook tight enough to iterate.

### Constraints
- **Founder time:** 10–15 hr/wk for human-touch outreach (WhatsApp first-touches, demo calls, in-person meetings, closing)
- **Helpers:** zero. Agent workforce handles all back-office / intelligence / drafting / QA (see `AGENT_WORKFORCE.md`)
- **Budget:** bootstrap. No ads until warm channels exhausted and product has testimonials. Sales hires commission-only until recurring revenue.
- **Languages:** Bahasa Indonesia and English primary. Tamil/Telugu/Hindi for India in sequence.

---

## 2. Positioning

### Indonesia
> *Indonesia's first full-Bahasa AI medical scribe and clinical management platform. We replace the 90 minutes a doctor spends typing notes every day with 15 minutes of review — in native Bahasa Indonesia, integrated with SATUSEHAT and BPJS. For the 180,000+ doctors still documenting by hand.*

**One-liner (ID):** "Larinova — aplikasi lengkap untuk dokter Indonesia, otomatis bikin catatan medis pakai AI, full Bahasa Indonesia."

### India
> *The only EMR platform with clinical-grade AI scribe support across all 22 Indian languages. For the 1.1M doctors working in Tamil, Telugu, Bengali, Marathi, and beyond who are underserved by English-primary alternatives. Powered by Sarvam AI, ABDM-native, half the price of Eka.Care.*

**One-liner (EN):** "Larinova — India's first AI-native EHR with clinical support in all 22 Indian languages."

---

## 3. ICP (Ideal Customer Profile)

### Indonesia — Jakarta only, priority order
1. **Solo private practice doctor** (*praktek mandiri*) in Jakarta — highest activation probability, per-doctor pricing aligns, lowest friction, decides alone
2. **Small clinic owner** (2–10 doctors, *klinik pratama/utama*) in Jakarta — owner-operator, per-doctor scales revenue, feels admin pain directly
3. **Mid-hospital admin** (50–300 beds, *RS tipe C/B*) in Jakarta metro — longer cycle but higher LTV, AI scribe is the hook into legacy SIMRS replacement
4. ~~Puskesmas~~ — deferred. Government cycle too slow, margins too thin, distracts from private-market proof
5. ~~Surabaya / Bandung / Bali / other Indonesian cities~~ — deferred to Day 90+ once Jakarta proof lands

### India — Chennai only, priority order
1. **Tamil-speaking solo GP / specialist in Chennai** — home advantage, Tamil language moat is the hero differentiator
2. **Small Chennai clinics (3–15 doctors)** — Tamil-primary practice, per-doctor pricing, owner decides
3. **High-volume specialty clinics in Chennai** (OB/GYN, dermatology, pediatrics, orthopedics) — 40+ patients/day = obvious scribe ROI, specialists are peer-network connectors
4. ~~Bengaluru / Hyderabad / Mumbai / Delhi~~ — deferred to Day 90+. Tamil-only Chennai focus sharpens the language moat story and compresses travel/demo logistics
5. ~~Hospital chains~~ — deferred to Year 2, requires enterprise motion we can't staff yet

### Disqualifiers (both markets)
- Facilities with <10 consults/day (no ROI on scribe)
- Non-digital clinics (paper only, no WiFi at point of care)
- Government facilities pre-certification (wait for credentialing)
- Anyone demanding custom deployment before paying

---

## 4. Buyer Personas

### Persona 1 — Dr. Andi (Solo Doctor, Indonesia)
- **Who:** 35–55, 20–40 consults/day, GP or specialist, owns or rents practice
- **Pain:** 90 min/day typing notes; falls behind on admin; loses to younger AI-enabled competitors eventually
- **Trigger:** peer WhatsApp recommendation, demo video, free-month offer
- **Authority:** buys alone, same day
- **Channel:** WhatsApp (primary), in-person demo if nearby, peer referral
- **Language:** Bahasa Indonesia always
- **Message tone:** warm, peer-to-peer, ROI-forward, no corporate language

### Persona 2 — Dr. Sari (Clinic Owner, Indonesia)
- **Who:** owns 1–5 clinic locations, 3–20 doctors, runs operations herself
- **Pain:** doctors inconsistent with notes; billing delays; patient retention weak; SATUSEHAT compliance deadline looming
- **Trigger:** staff complaints about current software; compliance pressure; competitor clinic adopts AI
- **Authority:** owner, buys within 2 meetings
- **Channel:** WhatsApp → in-person visit → email follow-up with formal proposal
- **Language:** Bahasa + some English
- **Message tone:** business-owner, emphasizes ROI + admin relief + compliance safety

### Persona 3 — Pak/Bu Direktur RS (Hospital Director, Indonesia)
- **Who:** hospital administrator, 150–500 bed hospital, non-clinical background
- **Pain:** compliance deadlines, legacy SIMRS painful, board asking about AI strategy
- **Trigger:** formal RFP, association introduction, procurement cycle
- **Authority:** recommends to board; procurement handles contract
- **Channel:** LinkedIn → formal email → in-person meeting
- **Language:** formal Bahasa, English for exec comms
- **Message tone:** formal, proposal-driven, emphasizes scale, compliance, AI differentiation, data residency

### Persona 4 — Tamil GP Dr. Ravi (Solo Doctor, India)
- **Who:** Tamil-speaking GP in Chennai, Coimbatore, Madurai; 30+ consults/day
- **Pain:** English EMRs don't understand his patients' Tamil symptoms; types in English, loses nuance
- **Trigger:** Sarvam Tamil scribe demo; local peer uses Larinova
- **Authority:** solo decision
- **Channel:** WhatsApp + phone call (phones work better in India than Indonesia)
- **Language:** Tamil (product) + English (business comms)
- **Message tone:** language-moat forward — "finally an EMR that speaks your patient's language"

### Persona 5 — Commission Sales Ambassador (both markets)
- **Who:** existing medical rep / pharma rep / clinical software trainer / doctor with network
- **Pain:** wants additional income; believes in healthcare digitization; has unused network access
- **Trigger:** clear commission structure, credible product, simple materials to share
- **Authority:** solo (joining as contractor)
- **Channel:** LinkedIn + medical-association intros
- **Language:** local
- **Message tone:** partnership/ambassador framing, NOT employee framing

---

## 5. Funnel Model

```
Cold first touch
  ↓ 5–8% response rate (target)
Qualified reply
  ↓ 40–60% book demo
Demo attended / trial signup
  ↓ 30–50% activation (actually use app)
Activated user
  ↓ 60–80% convert to paid after trial
Paying customer
```

### Working backward from Month 1 target (20 activated)
- Activated 20 → signups 50 → qualified replies 120 → **cold touches 2,000–2,500**
- Over 30 days = 70–85 touches/day
- Human-only rate: 50–80/day sustainable = not enough
- Agent-augmented: drafts 200/day, Gabriel vets + sends top 80 personally = **achievable**

### Working backward from Day 90 target (150 activated)
- Activated 150 → signups 400 → qualified replies 1,000 → **cold touches 15,000–20,000**
- Over 90 days = 165–220 touches/day
- Requires: 2–3 commission ambassadors active by Month 2 + referral loop from Month 1 cohort + agent output

---

## 6. Channel Matrix

### Indonesia
| Channel | Persona | Stage | Cost | Agent leverage | Priority |
|---|---|---|---|---|---|
| WhatsApp | Solo doctors, clinic owners | First touch + ongoing | Free | High (drafts, not sends) | P0 |
| In-person demo | Warm leads | Close | Time only | None | P0 |
| LinkedIn | Hospital admins, ambassador recruits | Formal intro | Free | High (full send + reply) | P1 |
| Email | Any lead not responding on WA | Secondary | Free (Resend 3k/mo) | High (full automation) | P1 |
| Medical associations (IDI, PDGI) | All doctor personas | Broadcast reach | Time + relationship | Partial | P2 |
| SEO / content marketing | Top-of-funnel discovery | Long-term | Free (agent writes) | Very high | P2 |
| Referral / ambassador | Existing users + commission reps | Viral loop | Pay-per-activation | Partial | P1 (Month 2+) |
| Paid ads (Meta, Google) | Solo doctors | Top-of-funnel | $ | High (creative + landing) | P3 (Month 4+) |

### India
Similar stack with two shifts:
- **Phone calls work better** than Indonesia — add to Gabriel's channel mix for Tier-2 cities
- **LinkedIn penetration higher** among urban Indian doctors — larger role

---

## 7. Message Framework

Every outbound message follows the same structure:

| Component | Purpose | Length |
|---|---|---|
| **Hook** | Relevance — why am I talking to THIS person | 1 sentence |
| **Proof** | Why Larinova specifically; what changes for them | 1–2 sentences |
| **Ask** | Low-friction next step | 1 sentence |

### Indonesia — Solo Doctor WhatsApp first touch
> Halo Dr. [Nama], saya Gabriel, founder Larinova. Kami buat aplikasi AI yang otomatis tulis catatan medis selama konsultasi — full Bahasa Indonesia.
>
> Tiap hari, Larinova hematkan ~90 menit waktu dokumentasi per dokter. Kami kasih 1 bulan gratis, tanpa kartu kredit.
>
> Boleh saya kirim video demo 60 detik?

### Indonesia — Clinic Owner WhatsApp first touch
> Halo Ibu/Bapak [Nama], saya Gabriel, founder Larinova. Aplikasi kami bantu klinik urus pasien, rekam medis, dan SATUSEHAT — plus AI scribe otomatis yang hemat waktu dokter 90 menit/hari.
>
> Untuk klinik ukuran Anda, kami hitung total saving sekitar Rp X juta/bulan dari waktu dokter yang terselamatkan. 1 bulan gratis untuk tes.
>
> Mau saya kirim proposal 1-halaman yang disesuaikan dengan klinik Anda?

### India — Tamil GP WhatsApp first touch
> Hi Dr. [Name], I'm Gabriel — founder of Larinova. We built the first EMR that actually handles Tamil clinical conversations. Your patient speaks Tamil, your notes are Tamil, the AI extracts structured records — no English translation.
>
> Free for 1 month, no card needed. Can I send a 60-second Tamil demo?

### Recruit Ambassador — LinkedIn first touch
> Hi [Name] — saw you've been in Indonesian healthcare for X years. I'm building Larinova, the first AI medical scribe for Indonesian doctors. Already seeing 90-min/day time savings in pilot users.
>
> I'm looking for 2–3 founding ambassadors to introduce Larinova to doctors in their networks — commission-only, transparent structure, you set your own pace. Open to a 15-min chat?

**All first-touch templates are agent-generated from a persona profile + lead enrichment, then reviewed by Gabriel before sending.** See `AGENT_WORKFORCE.md` → Message Drafter.

---

## 8. Collateral Inventory (Execution Queue)

Ordered by priority. Each item is a small sprint — design → draft → review → ship.

| # | Asset | Priority | Audience | Blocks |
|---|---|---|---|---|
| 1 | **Fix pitch deck pricing bugs** (Mid_Clinic, Small_Clinic — both EN/ID) | **P0 — URGENT** | Clinic owners | Any outreach today |
| 2 | **Indonesia 1-pager** (shareable via WA) | P0 | Solo doctors, clinic owners | First-touch campaigns |
| 3 | **Opener message library** — canonical templates per persona × channel | P0 | Gabriel + agents | Message Drafter agent |
| 4 | **60-sec product demo video** (Bahasa voiceover, WA-sized) | P0 | Solo doctors | First-touch close |
| 5 | **Discovery form rebuild** — fix tagline + domain bugs | P1 | Interested doctors | Post-demo conversion |
| 6 | **Public pricing page live on larinova.com** | P1 | Googling doctors | Credibility signal |
| 7 | **Recruiting 1-pager + deck** for ambassadors | P1 | Commission recruits | Ambassador program launch |
| 8 | **India 1-pager** (Tamil/English) | P1 | India solo doctors | India outreach start |
| 9 | **India business context doc** (`CLAUDE_INDIA_CONTEXT.md`) | P1 | Claude + future hires | India orientation |
| 10 | **Internal pricing strategy PDFs rebuilt** (₹ bug, layout fixes) | P2 | Internal | Already-known bug |
| 11 | **FAQ / security / compliance one-pager** | P2 | Hospital admin personas | Enterprise credibility |
| 12 | **Case study template** (filled after first 3 paid customers) | P2 | All personas | Social proof loop |

Each delivered via the HTML + print CSS stack discussed earlier — single source, regenerable.

---

## 9. Agent Workforce

Full spec: `strategy/AGENT_WORKFORCE.md`. Eight defined agent roles; each is a structured prompt + workflow + checklist. Summary:

1. **Lead Researcher** — enriches raw leads with public info
2. **Message Drafter** — writes personalized first-touch per lead
3. **Follow-up Sequencer** — manages N-day follow-up cadence
4. **CRM Logger** — maintains conversation tracker
5. **Localization Reviewer** — QA for Bahasa / Tamil / Hindi tone
6. **Weekly Analyst** — metrics report + flagged anomalies
7. **Collateral Generator** — 1-pagers, landing copy, variants
8. **Demo Prep** — pre-call briefing on each scheduled lead

**Agents prepare → Gabriel executes → agents follow up.**

---

## 10. Cadence

### Daily (Gabriel, ~2 hr)
- **08:00–08:30** — review overnight agent outputs: enriched leads, draft messages, replies to sort
- **08:30–09:30** — send 15–25 personal first-touches to top-priority leads (WA + LinkedIn)
- **12:30–13:00** — lunch pass: respond to replies, book demos
- **17:00–18:00** — logged demos + calls (2–3 per day once pipeline builds)
- **21:00 (optional)** — evening reply sweep before bed

### Weekly (Gabriel, ~3 hr)
- **Monday AM** — read Weekly Analyst report, adjust targets, plan week
- **Wednesday block** — demo day, 3–4 scheduled demos
- **Friday PM** — pipeline review, send retention check-ins to activated trial users

### Monthly
- Strategy review (this doc + metrics)
- Update targets based on reality
- Iterate message templates using A/B data
- Add/retire agent roles based on what's actually working

---

## 11. Tools (Free-tier stack)

| Purpose | Tool | Cost | Notes |
|---|---|---|---|
| CRM | Google Sheets (templated) + CRM Logger agent | Free | Upgrade to Attio / Pipedrive when >500 leads |
| WhatsApp (manual) | Personal WhatsApp | Free | For warm/priority sends — Gabriel only |
| WhatsApp (volume) | WhatsApp Business app | Free | Template messages, 5 labels, broadcast list ≤256 |
| Email | Resend | Free tier 3k/mo | Already integrated in landing |
| Scheduling | Cal.com | Free | Book demos via 1-click WA link |
| Analytics | Google Analytics + Supabase custom dash | Free | Track signup → activation funnel |
| LinkedIn outreach | Personal + 1 Sales Navigator free trial | Free | Manual sends only (TOS) |
| Video hosting | YouTube (unlisted) + Cloudinary | Free | Embed into 1-pager and landing |
| Form | Tally.so or existing `/discovery-survey` | Free | Discovery form data capture |

**Total monthly tool cost: $0.**

Add-ons when warranted:
- Bahasa freelance reviewer: $50–100/wk (only if agent review proves insufficient)
- Phone VoIP (Krisp / Dialpad free tier) for India calls
- LinkedIn Sales Navigator paid ($79/mo) once ambassador program proves ROI

---

## 12. Metrics & Targets

### Weekly dashboard (Weekly Analyst agent generates this every Monday 06:00)

| Metric | Week target (stabilized) | Red flag |
|---|---|---|
| First touches sent | 120–180 | <80 |
| Response rate | ≥5% | <2% |
| Qualified replies | 8–12 | <4 |
| Demos booked | 5–8 | <3 |
| Demos attended | 4–6 | <2 |
| Trial signups | 4–6 | <2 |
| Activated trials (>3 sessions) | 3–5 | <1 |
| Paid conversions | 2–4 (from Month 3) | 0 after Month 3 |
| Avg time Gabriel spent | 10–15 hr | >20 or <8 |

### Leading vs lagging
- **Leading (weekly):** touches, response rate, demos booked
- **Lagging (monthly):** activations, paid conversions, MRR

### A/B testing log
Every message template tested in batches of 50 minimum. Winners promoted to canonical library, losers retired. Weekly Analyst flags statistical significance.

---

## 13. 90-Day Execution Plan

### Month 1 — Foundation (Day 1–30)

**Week 1 — Fix foundation, deploy agents (parallel streams Jakarta + Chennai)**
- Collateral P0: fix pitch deck pricing bugs (Mid_Clinic + Small_Clinic, both EN + ID)
- Collateral P0: ship BOTH Indonesia (Jakarta) + India (Chennai) 1-pagers
- Collateral P0: opener message library drafted — Bahasa + English + Tamil variants
- Agent Workforce role-specs handed to external agents (per `AGENT_WORKFORCE.md`)
- Gabriel: 20 first-touches to Jakarta leads + 20 first-touches to Chennai leads (Tamil network)
- First demos booked (target: 2 Jakarta + 2 Chennai)

**Week 2 — Demo + refine**
- Collateral P0: 60-sec demo video shipped (Bahasa + Tamil versions)
- Gabriel: 25–35 first-touches per city per week
- First trial signups (target: 3 Jakarta + 3 Chennai)
- Localization Reviewer feedback loop active — tune Bahasa AND Tamil messages separately

**Week 3 — First conversions**
- Discovery form rebuild shipped (P1) — Bahasa + English + Tamil
- Gabriel: 35–45 first-touches per city per week, 2–3 demos per city per week
- First paid conversions from Month 1 cohort (target: 1 Jakarta + 1 Chennai)
- Recruiting 1-pager drafted

**Week 4 — Ambassador program pilot launch**
- Recruiting 1-pager + deck live (ID + EN versions)
- LinkedIn outreach to 20 Jakarta ambassador candidates + 20 Chennai ambassador candidates
- Total Month 1: ~100–125 first-touches per city, **target: 20 activated (10+10) / 50 signups / 4–6 paid**

### Month 2 — Scale (Day 31–60)
- Onboard 1–2 commission ambassadors in Jakarta (launch with 1-pager + short deck + leads template)
- Onboard 1 commission ambassador in Chennai (Tamil-speaking, with doctor network)
- Case studies drafted from Month 1 activated users in BOTH cities (social proof loop)
- Pricing page live on larinova.com (with both INR and IDR currency switch)
- Monthly review — adjust targets, kill what doesn't work
- Month 2 target: +60 activated (80 total), split ~30 Jakarta / ~30 Chennai; +15 paid (20 total)

### Month 3 — Prove the model (Day 61–90)
- First institutional lead engaged (hospital chain OR medical association partnership)
- Ambassador cohort expands to 4–6
- India ambassador recruited
- Referral program live (existing users get 1 month free per referral who activates)
- Day 90 target: **150 total activated, 400 signed up, 30–40 paid**
- Day 90 decision point: if trajectory clean → plan Month 4–6 with optional ad budget; if miss → tighter retargeting before scaling

---

## 14. Risks & Early Warnings

| Risk | Early warning signal | Mitigation |
|---|---|---|
| Response rate <2% | Week 2 aggregate stats | Pause volume, rewrite opener, test 3 new hooks |
| Gabriel burnout | 2+ missed days in a row, or hours creep >20 | Reduce Month 1 target to 15, push more to agents, take weekend |
| Bahasa tone failures | Native speaker flags AI-ness | Hire $50/wk freelance reviewer, retrain Localization agent |
| No ambassador response | Week 4 LinkedIn <1% positive | Adjust offer (higher % commission, medical-association channel) |
| Pricing misalignment sinks a deal | Lost lead explicitly cites "you quoted different price" | P0 rebuild of ALL pricing collateral in one pass |
| Product bug kills first cohort trust | NPS <6 on first 5 users | **Halt outreach.** Fix before scaling. No exceptions. |
| Competitor ships same feature (Eka.Care expands to Tamil) | News / funding announcement | Accelerate India launch, differentiate on full-stack features |
| SATUSEHAT / ABDM compliance delay | Certification timeline slips | Indonesia: proceed with integration (doesn't block sales). India: defer govt segment (already in plan). |
| WhatsApp TOS action (account flagged) | Rate limits appear | Move to WA Business + template messages; diversify to LinkedIn + email |

### Hard rules (non-negotiable)
1. **Never** send outreach with broken pricing in attachments
2. **Never** claim product features that aren't live
3. **Never** automate voice-AI calls to doctors (cultural + legal risk)
4. **Always** review agent-generated Bahasa before sending
5. **Always** log every conversation in CRM before end of day

---

## Appendix A — Open questions to resolve in Monthly Reviews

- When does the 1-founder-plus-agents model cap out? (Probably Month 3–4 based on demo load.)
- Should we pursue WhatsApp Business API upgrade ($$) once volume exceeds manual cap?
- When do we kill India parallel focus if Indonesia is outperforming 3:1?
- At what MRR do we switch first salesperson from commission-only to base+comm?
- When does the Bahasa freelance-reviewer budget unlock?

Each gets revisited monthly with actual data.
