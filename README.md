# Larinova Workspace

Private monorepo containing all Larinova work: product code, marketing site, strategy docs, sales collateral, brand assets.

**Status:** Active. Indonesia launch in progress (April 2026).

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

## Branching model (two-laptop workflow)

This repo uses a per-laptop branch pattern during the initial sync:

- `main` — clean, merged state of both laptops
- `m4-pro` — snapshot of work done on the M4 Pro laptop
- `m2-pro` — snapshot of work done on the M2 Pro laptop

### Initial consolidation sequence

1. `m4-pro` branch pushed from M4 Pro (done as of initial commit)
2. `m2-pro` branch pushed from M2 Pro (pending)
3. Merge both into `main`, resolve conflicts, delete laptop branches
4. Going forward: work on feature branches off `main`, both laptops pull/push to `main`

### Daily habit after consolidation

- Every session: `git pull --rebase` before editing, commit often, `git push` before switching laptops
- Never edit the same file on both laptops between pull and push

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
