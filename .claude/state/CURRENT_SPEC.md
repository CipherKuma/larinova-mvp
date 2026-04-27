# Current Spec

## Goal
Ship the India OPD platform end-to-end: booking → intake → AI-prepared consult → recorded consult → email wellness follow-up (SMS + WhatsApp follow-ups land in v1.1). Doctor pays via Razorpay Live; 5 pilot doctors whitelisted as alpha pro. Patient journey works over Email today; optional patient portal at `patient.larinova.com`. Indonesia ships the same OPD landing in parallel; Indonesia *app* (Xendit, Deepgram tuning, ID patient portal) deferred.

## Decided
- **Tiering:** Free = 20 consultations/month; Pro = unlimited. Whitelist array in `lib/subscription.ts` upgrades emails on login.
- **Pilot:** 5 doctors whitelisted pro from day one; receive alpha welcome banner + email.
- **Pricing:** IN ₹1,500/mo + ₹15,000/yr; ID IDR 299k/mo + IDR 2.99M/yr (display-only); default USD $20/$200.
- **Queue / orchestration:** Inngest (event-driven, durable, TypeScript-first). `pg_cron` only for trivial periodic jobs.
- **Agents:** three new — Pre-consult Intake AI, Post-consult Dispatcher, Wellness Follow-up (conversational, 1d/3d/7d).
- **Notifications stack — v1 truth:** Resend (email) is shipping. MSG91 (SMS) and Meta WhatsApp Business Cloud API direct (WhatsApp) are deferred to v1.1. **Gupshup BSP rejected** — going direct to Meta avoids markup, lock-in, and a vendor dependency. Deferral is paperwork-bound (Meta Business Verification, ~1–2 weeks), not engineering-bound.
- **Patient portal:** `patient.larinova.com`, separate Vercel project, shared Supabase DB, magic-link auth, 5 routes.
- **Billing provider:** Razorpay Live for India (single Pro tier, no 4-tier split yet). Xendit for Indonesia deferred.
- **AI inference:** Claude Service (`claude.fierypools.fun`) per global rule — no direct Anthropic calls.
- **PWA:** `app.larinova.com` has manifest + icons + service worker. Verified 2026-04-26 — SW activates correctly on second load (`controller: true`); offline fallback page wired via Serwist.
- **Landing:** OPD reframe applied to BOTH `/in` and `/id` (Indonesia parity decided 2026-04-26). Hero headline = "The most advanced OPD assistant for Indian doctors" (Bahasa equivalent for `/id`). Trust section refactored from 4-grid → alternating left-right rows with inline proof visuals. Hero video placeholder slot wired in `HeroIndia.tsx` for the upcoming Higgsfield loop.
- **Sign-in honesty:** "Continue with Phone" button disabled with "Soon" pill until SMS is live.
- **Promo / hero videos:** Two videos (hero loop + full promo) generated via Higgsfield AI, anchored on real app screenshots. Public release of the videos GATED on SMS being live (so on-screen flow is honest). Tracked as a separate Track 2 spec (forthcoming).
- **Spec doc:** `docs/superpowers/specs/2026-04-23-india-opd-platform-design.md` (committed e26ea90).

## Open
- Razorpay dashboard login deferred (user will provide keys/plan IDs later)
- MSG91 DLT template approvals need to be filed (for v1.1 SMS)
- Meta WhatsApp Business Verification — paperwork to file (GST cert, business registration), gates v1.1 WhatsApp
- 5 pilot doctor emails to be added to `PRO_WHITELIST`
- Higgsfield video generation plan (Track 2 spec to be written after polish lands)

## Out of scope (v1)
- SMS (MSG91) and WhatsApp (Meta direct) — deferred to v1.1
- Indonesia *app* work: Xendit, Deepgram tuning, `id` patient portal — landing parity is in scope; app parity is not
- 4-tier Starter/Basic/Pro/Business pricing (future)
- Multi-doctor clinic / reception role, ABDM, drug interactions, offline recording, push notifications, analytics dashboard
- Public release of the hero loop / full promo videos (gated on SMS being live)

## Definition of done
See §15 of the spec doc. v1 ships email-only notifications; SMS + WhatsApp + video public-release land in v1.1. PWA Lighthouse ≥ 90, patient portal live, all three agents running on email channel, Razorpay Live end-to-end, Playwright suite green, Inngest dashboard clean. Indonesia OPD landing live and visually identical to India OPD landing.
