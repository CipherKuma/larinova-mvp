# Larinova

End-to-end OPD platform for Indian doctors. Patients book online, complete an AI-guided intake, and arrive with the doctor already holding a Prep Brief. During the consult, Larinova transcribes Tamil/Hindi/English speech and produces SOAP notes, ICD-10 codes, and a signed prescription in real time. After the visit, summaries and prescriptions go out by email (SMS + WhatsApp in v1.1), and a wellness agent follows up at days 1, 3, and 7. Indonesia ships the same OPD landing in parallel; the Indonesia app is scribe-only for now.

This repo holds both the code and the ops material, split into subdirs so they can have different MCP configs. The rule: **Gmail/WhatsApp MCPs live inside `ops/`**, so they only load when your CWD is inside that subdir. Code sessions at the repo root (or in `app/`, `landing/`, `patient-portal/`) never see them. See `ops/CLAUDE.md`.

## Brand
- **Name**: Larinova (formerly Kosyn)
- **Domain**: larinova.com
- **Emails**: hello@larinova.com (primary), contact@larinova.com (secondary)
- **Tagline**: "The OPD assistant for Indian doctors"
- **Founder**: Gabriel Antony Xaviour

## Directory structure
```
larinova/
├── CLAUDE.md                ← you are here (code-scope + pointer to ops/)
├── AGENTS.md                ← installed CLIs + scripts for agents
├── README.md
├── cmux.json                ← dev workspace layout
├── .mcp.json                ← repo-root MCPs (Context7) — loaded everywhere
├── .claude/                 ← Claude Code state (spec, skills, tdd-guard)
│
├── Code (open Claude Code at the repo root)
│   ├── app/                 ← product app (Next.js, own CLAUDE.md)
│   ├── landing/             ← marketing site (Next.js, own CLAUDE.md)
│   ├── patient-portal/      ← patient.larinova.com (Next.js)
│   └── docs/                ← technical docs
│       └── superpowers/     ← spec docs, plans, launch evidence
│
└── ops/                     ← non-technical (open Claude Code here for ops work)
    ├── CLAUDE.md
    ├── .mcp.json            ← local Gmail MCP (gabrielantony56@gmail.com)
    ├── .gitignore
    ├── strategy/            ← INDONESIA_PLAYBOOK, INDIA_PLAYBOOK, GO_TO_MARKET, etc.
    ├── sales/               ← decks, discovery forms, leads
    ├── collateral/          ← marketing assets
    ├── logo-gen/            ← brand logos
    ├── docs/                ← SALES_OUTREACH_PLAN, PRICING_IMPL, Competitive_Research,
    │                         india/ + indonesia/ pricing-strategy HTML/PDF
    └── whatsapp/            ← whatsapp-web.js CLI (pair/send/list)
```

## How the MCP split works
Claude Code walks **up** from CWD to find `.mcp.json`. So:
- Working at the repo root or in `app/` / `landing/` / `patient-portal/` → only `.mcp.json` at the root is seen. Gmail/WhatsApp not loaded.
- Working in `ops/` or deeper → `ops/.mcp.json` becomes visible too. Gmail available.

When switching modes, restart your Claude Code session in the appropriate directory.

## Current focus (April 2026)
- **Indonesia launch** — primary. Meeting doctors IRL, collecting testimonials, then cold outreach to ~50 hospital leads.
- **India** — secondary market, maintained but not actively launching.
- **Offer**: 1 month free, full access, no credit card. Same everywhere.
- **Active spec**: `docs/superpowers/specs/2026-04-23-india-opd-platform-design.md`.

## Conventions
- Every user-facing CTA links to `https://app.larinova.com` (never `#pricing` or `#`).
- Email sender is always `hello@larinova.com` — never `noreply@`, `onboarding@resend.dev`, or `raxgbc.co.in`.
- Canonical domain is `larinova.com` (not `larinova.id`).
- Any Indonesian text in internal docs must carry an English translation alongside.

## Per-subdir context
When working inside `landing/`, `app/`, `patient-portal/`, or `ops/`, Claude Code auto-loads that subdir's `CLAUDE.md`. Read it first — stack, routes, and conventions live there.

## Strategy docs
All strategy and sales material lives under `ops/`. See `ops/CLAUDE.md` for the index.
