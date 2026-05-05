# larinova/ops

Non-technical subdir of the larinova project. Business, strategy, creative, sales, outreach, ops tooling — no application code, no deploys.

Branch/product rule: `main` is the canonical working branch for all Larinova work. `india-pilot` is only a legacy GitHub default-branch artifact. Treat Larinova as one OPD product for India and Indonesia together; market differences belong in docs, locale/config, outreach, and compliance notes, not in separate long-lived branches.

## Why this subdir exists

The main `larinova/` repo holds app code (Next.js apps for `app.larinova.com`, `larinova.com`, `patient.larinova.com`). Ops-side MCPs (Gmail, WhatsApp) would bleed into coding sessions and pollute context if loaded at repo root. So they live here: Claude Code walks **up** from the current working dir to find `.mcp.json`, so `ops/.mcp.json` is only visible when your CWD is inside `ops/`. When you `cd` into `app/` or `landing/`, it is invisible.

**Net effect:**
- `cd ~/Documents/products/larinova` (code work) → only `.mcp.json` at repo root loads (Context7). No Gmail/WhatsApp noise.
- `cd ~/Documents/products/larinova/ops` (ops work) → Claude Code sees `ops/.mcp.json` (Gmail) in addition. WhatsApp CLI available via Bash.

## Directory layout

```
ops/
├── CLAUDE.md                         (you are here)
├── README.md
├── .mcp.json                         local Gmail MCP (commented until OAuth done)
├── .claude/                          ops-scoped skills & settings
├── .gitignore                        (nested — excludes node_modules, auth files)
├── docs/
│   ├── SALES_OUTREACH_PLAN.md
│   ├── PRICING_IMPLEMENTATION_INSTRUCTIONS.md
│   ├── Competitive_Research_Report.html
│   ├── india/pricing-strategy.{html,pdf}
│   ├── indonesia/pricing-strategy.{html,pdf}
│   ├── _shared/strategy-doc.css
│   └── build.sh                      (weasyprint HTML → PDF)
├── strategy/
│   ├── INDIA_PLAYBOOK.md
│   ├── INDONESIA_PLAYBOOK.md
│   ├── GO_TO_MARKET.md
│   ├── AGENT_WORKFORCE.md
│   └── SIGDA_OPTIMA_FORM_SPEC.md
├── sales/                            decks, discovery forms, leads
├── collateral/                       marketing assets
├── brand/                            canonical brand logos (only approved files)
├── logo-gen/                         compatibility aliases regenerated from brand/logos
└── whatsapp/                         whatsapp-web.js CLI (pair/send/list)
```

## Cross-references to code

Strategy docs reference app behavior (pricing, whitelist, landing features). When a strategy doc prescribes a code change, `cd ..` to the repo root to execute it. Don't try to edit code from here — Cursor/Claude Code should be restarted at the root when switching modes.

## Current focus (May 2026)

- **One OPD product** — India and Indonesia move together in the same Larinova app, landing workspace, and Supabase project.
- **Market-specific ops** — keep India/Indonesia outreach, pricing, compliance, and language differences explicit in docs, but do not split the product into separate app/branch concepts.
- **Offer**: 1 month free, full access, no credit card. Same everywhere unless a market-specific document says otherwise.
- **Active spec** (in the code side of this repo): `../.claude/state/CURRENT_SPEC.md`.

## Key strategy docs

- `strategy/INDONESIA_PLAYBOOK.md` — Indonesia GTM
- `strategy/INDIA_PLAYBOOK.md` — India (Chennai) GTM
- `strategy/GO_TO_MARKET.md` — cross-market notes
- `strategy/AGENT_WORKFORCE.md` — AI agent workforce strategy
- `strategy/SIGDA_OPTIMA_FORM_SPEC.md` — competitor form spec
- `docs/SALES_OUTREACH_PLAN.md` — sales strategy & outreach templates
- `docs/PRICING_IMPLEMENTATION_INSTRUCTIONS.md` — future tiered pricing
- `docs/Competitive_Research_Report.html` — competitor analysis
- `docs/india/pricing-strategy.html` + `docs/indonesia/pricing-strategy.html` — per-market pricing rationale (build PDFs with `docs/build.sh`)

## Conventions (inherited from repo root)

- All user-facing CTAs link to `https://app.larinova.com`.
- Email sender is always `hello@larinova.com`.
- Canonical domain is `larinova.com`.
- Any Indonesian text in internal docs carries an English translation alongside.

## MCPs / tools

- **Gmail** — local MCP via `@gongrzhe/server-gmail-autoauth-mcp`, scoped to `gabrielantony56@gmail.com`. Setup in `README.md`. Not active until OAuth credentials file is placed at `.gmail-credentials.json` and the `_gmail_disabled` key is renamed to `gmail` in `.mcp.json`.
- **WhatsApp** — not an MCP. `whatsapp/` holds a CLI. Use via Bash: `cd whatsapp && npm run list` / `npm run send -- --to=<jid> --text="…"`.

## Skills / plugins

Install ops-relevant skills into `.claude/` at this level — they will not leak into the code side of the repo because Claude Code resolves skill config per-CWD. Candidates: readme, pitch-deck-builder, notion-api, youtube-transcript, seo. Keep code-oriented skills (TDD, playwright, supabase) at the repo root.
