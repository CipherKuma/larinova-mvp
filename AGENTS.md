# Agent Tools — larinova

<!--
Load-bearing: Claude Code reads this at session start. Document every CLI,
script, or tool the agent can reach for here. When Claude learns a useful
shell pattern in this project, add it below. When Claude makes a mistake
that a better tool would have prevented, add that tool here.

Maintain with: /maintain-agents-md
-->

## Installed CLIs
- `gh` — GitHub CLI. Use for PRs, issues, workflow runs. Prefer over GitHub MCP.
- `vercel` — Deployment CLI. Larinova deploys to Vercel. Use `vercel ls`, `vercel logs`, `vercel env`.
- `supabase` — Supabase CLI. Migrations, local DB, RLS testing. Prefer over Supabase MCP for routine work.
- `pnpm` — Package manager (app). Use `pnpm <script>` inside `app/`.
- `npm` — Package manager (landing). Use `npm <script>` inside `landing/`.
- `npx playwright-cli-sessions` — Browser automation with saved auth sessions. See `~/.claude/rules/testing-rules.md`. Prefer over Playwright MCP.
- `cmux` — Terminal multiplexer for multi-agent layouts. See `~/.claude/rules/cmux-teams.md`.
- `yt-dlp` — YouTube/video downloads. Used for research transcripts.
- `~/.claude/vault/inject.sh get VAR1 VAR2 [--dir <path>]` — Env var injection from vault. Never read `.env.master` directly.

## Project scripts

### `app/` (product, `pnpm`)
- `pnpm dev` — Next.js dev server
- `pnpm build` — Production build
- `pnpm start` — Serve production build
- `pnpm lint` — Next lint
- `pnpm test:e2e` — Playwright E2E
- `pnpm test:e2e:headed` — E2E with visible browser
- `pnpm test:e2e:debug` — E2E debug mode
- `pnpm test:e2e:report` — Upload test results to Notion via `tests/e2e/helpers/notion-report.ts`

### `landing/` (marketing, `npm`)
- `npm run dev` — Next.js dev server
- `npm run build` — Production build
- `npm run start` — Serve production build
- `npm run lint` — ESLint

## Preferred shell patterns
- **Playwright auth:** always pass `--session=<name>` — never launch a raw browser just to test authed flows. See testing-rules.md.
- **Env vars:** run `~/.claude/vault/inject.sh get <VAR> --dir <subdir>` — do not hand-edit `.env.local` beyond what vault writes.
- **Vercel verify:** after push, `vercel ls larinova-app` / `vercel ls larinova-landing` to check Ready. A fix is only done when verified on the live URL, impersonated as a non-admin user.
- **Supabase migrations:** use `supabase db push` from the `app/` directory. The `APPLY_MIGRATIONS.sql` is a staging file, not authoritative.
- **Shadcn components:** use the `shadcn` skill. New components go via the CLI, not hand-written.
- **Locale copy edits:** `landing/` copy → `src/data/locale-content.ts` (both `in` + `id` entries). `app/` copy → `messages/in.json` or `messages/id.json`.

## Things to avoid
- Do **not** install Playwright MCP or Chrome DevTools MCP. `playwright-cli-sessions` covers both. See `~/Documents/infra/playwright-cli-sessions/docs/DEVTOOLS-PARITY-PROPOSAL.md` for the extension plan if coverage gaps emerge.
- Do **not** read `.env.master` directly — always go through `inject.sh`.
- Do **not** commit anything under `.next/`, `node_modules/`, `test-results/`, or any `*.tsbuildinfo`.
- Do **not** use `<input type="date">` or `<input type="number">` — see `~/.claude/rules/ui-rules.md` (use shadcn Calendar + text input with regex parse).
- Do **not** put search icons inside search inputs — see ui-rules.md.
- Do **not** add stat-card dashboards — lead with the primary action. See ui-rules.md.
- Do **not** modify migrations that have already shipped to prod. Create a new forward migration instead.
- Do **not** hardcode copy — always pull from `locale-content.ts` (landing) or `messages/*.json` (app).
