# Larinova

AI medical scribe for doctors in India and Indonesia. Records doctor-patient consultations in the local language, then auto-generates SOAP notes, ICD-10 codes, and prescriptions.

## Brand
- **Name**: Larinova (formerly Kosyn — all Kosyn references archived in `_archive/deprecated-kosyn/`)
- **Domain**: larinova.com
- **Emails**: hello@larinova.com (primary), contact@larinova.com (secondary)
- **Tagline**: "AI Medical Scribe for Doctors"
- **Founder**: Gabriel Antony Xaviour

## Directory Structure
```
larinova/
├── CLAUDE.md                ← project-wide context (you are here)
├── landing/                 ← marketing site (has its own CLAUDE.md)
├── app/                     ← product app (has its own CLAUDE.md)
├── docs/                    ← strategy & implementation docs
├── sales/                   ← pitch decks, discovery forms, leads
├── strategy/                ← go-to-market and positioning
├── collateral/              ← marketing assets
├── logo-gen/                ← brand logos
├── _archive/                ← deprecated Kosyn files (PII redacted)
├── .claude/                 ← Claude Code state (spec, ledger)
├── .mcp.json                ← project MCPs (Context7)
└── cmux.json                ← dev workspace layout
```

## Current focus (April 2026)
- **Indonesia launch** — primary. Meeting doctors IRL, collecting testimonials, then cold outreach to ~50 hospital leads.
- **India** — secondary market, maintained but not actively launching.
- **Offer**: 1 month free, full access, no credit card. Same everywhere.

## Top-level conventions
- Every user-facing CTA links to `https://app.larinova.com` (never `#pricing` or `#`).
- Email sender is always `hello@larinova.com` — never `noreply@`, `onboarding@resend.dev`, or `raxgbc.co.in`.
- Canonical domain is `larinova.com` (not `larinova.id`).
- Any Indonesian text in internal docs must carry an English translation alongside.

## Key strategy docs
- `strategy/INDONESIA_PLAYBOOK.md` — full Indonesia GTM playbook (positioning, ICP, outreach scripts, messaging)
- `strategy/INDIA_PLAYBOOK.md` — full India (Chennai) GTM playbook
- `strategy/GO_TO_MARKET.md` — cross-market GTM notes
- `strategy/AGENT_WORKFORCE.md` — AI agent workforce strategy
- `strategy/SIGDA_OPTIMA_FORM_SPEC.md` — competitive intelligence (Sigda Optima form spec)
- `docs/SALES_OUTREACH_PLAN.md` — sales strategy + outreach templates
- `docs/PRICING_IMPLEMENTATION_INSTRUCTIONS.md` — future tiered pricing (Month 2-3)
- `docs/Competitive_Research_Report.html` — competitor analysis and pricing benchmarks

## Per-subdir context
When working inside `landing/` or `app/`, Claude Code auto-loads that subdir's `CLAUDE.md`. Read it first — it contains the stack, routes, and conventions specific to that codebase.
