# Larinova Workspace

Private monorepo containing all Larinova work: product code, marketing site, strategy docs, sales collateral, brand assets.

**Status:** Active. India and Indonesia OPD launch work now moves through one shared product on `main`.

---

## What's in here

| Folder | Contents |
|---|---|
| `landing/` | Marketing site (Next.js) — deployed at larinova.com |
| `app/` | Core product app (Next.js + Supabase) — deployed at app.larinova.com |
| `docs/` | Strategy: sales plan, pricing plan, competitive research, clinical form spec |
| `sales/` | Pitch decks, discovery forms, launch playbook, leads |
| `logo-gen/` | Brand logos and icons |
| `command-center/` | AI agent skill definitions |
| `_archive/deprecated-kosyn/` | Pre-rebrand archive (historical reference only) |
| `AUDIT_2026-04-18.md` | Most recent honest audit of the whole project |
| `CLAUDE.md` | Project context for AI sessions |

See `CLAUDE.md` for architecture details, brand conventions, and key files.

---

## Branch policy

`main` is the canonical working branch for Larinova. Start every Claude/Codex session from `main`, pull/rebase from `origin/main`, commit on `main`, and push to `origin/main` unless Gabriel explicitly asks for a feature branch.

`india-pilot` is a legacy GitHub default-branch artifact only. It is not the active product branch, and new work must not be based on it.

The product is one Larinova OPD app for India and Indonesia together. Market differences belong in locale/config/data, not in long-lived Git branches.

---

## Local setup

Each sub-project still has its own dependencies:

```bash
# Landing site
cd landing && npm install && npm run dev

# Product app
cd app && pnpm install && pnpm dev
```

Required env files (never committed) — see each sub-project's `.env.example` for the shape.

---

## Secrets

All `.env*` files are gitignored (except `.env.example`). If you need to share credentials, use a password manager, not git.
