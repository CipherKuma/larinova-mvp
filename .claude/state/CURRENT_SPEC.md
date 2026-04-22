# Current Spec

## Goal
Ship the full India OPD platform end-to-end: booking → intake → AI-prepared consult → recorded consult → WhatsApp wellness follow-up. Doctor pays via Razorpay Live; 5 pilot doctors whitelisted as alpha pro. Patient journey works entirely over Email/SMS/WhatsApp; optional patient portal at `patient.larinova.com`. Indonesia explicitly deferred.

## Decided
- **Tiering:** Free = 20 consultations/month; Pro = unlimited. Whitelist array in `lib/subscription.ts` upgrades emails on login.
- **Pilot:** 5 doctors whitelisted pro from day one; receive alpha welcome banner + email.
- **Pricing:** IN ₹1,500/mo + ₹15,000/yr; ID IDR 299k/mo + IDR 2.99M/yr (display-only); default USD $20/$200.
- **Queue / orchestration:** Inngest (event-driven, durable, TypeScript-first). `pg_cron` only for trivial periodic jobs.
- **Agents:** three new — Pre-consult Intake AI, Post-consult Dispatcher, Wellness Follow-up (conversational, 1d/3d/7d).
- **Notifications:** unified `lib/notify/` — Resend (email) + MSG91 (India SMS, DLT-compliant) + Gupshup (WhatsApp).
- **Patient portal:** `patient.larinova.com`, separate Vercel project, shared Supabase DB, magic-link auth, 5 routes.
- **Billing provider:** Razorpay Live for India (single Pro tier, no 4-tier split yet). Xendit for Indonesia deferred.
- **AI inference:** Claude Service (`claude.fierypools.fun`) per global rule — no direct Anthropic calls.
- **PWA:** `app.larinova.com` gets manifest + icons + service worker; offline fallback only, no API caching.
- **Landing:** India fully OPD-first reframe — scroll-narrative feature section, 2-tier pricing with live Razorpay Checkout.
- **Spec doc:** `docs/superpowers/specs/2026-04-23-india-opd-platform-design.md` (committed e26ea90).

## Open
- Razorpay dashboard login deferred (user will provide keys/plan IDs later)
- DNS for `patient.larinova.com` subdomain pending
- MSG91 DLT template approvals need to be filed
- Gupshup BSP onboarding pending
- 5 pilot doctor emails to be added to `PRO_WHITELIST`

## Out of scope
- Indonesia (Xendit wiring, Bahasa landing, Deepgram changes, `id` patient portal)
- Meta WhatsApp Cloud API (Gupshup only for now)
- 4-tier Starter/Basic/Pro/Business pricing (future)
- Multi-doctor clinic / reception role, ABDM, drug interactions, offline recording, push notifications, analytics dashboard

## Definition of done
See §15 of the spec doc. Full audit pass, 5 doctors whitelisted, Razorpay Live end-to-end, PWA Lighthouse ≥ 90, patient portal live, all three agents running, Playwright suite green, Inngest dashboard clean.
