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


<claude-mem-context>
# Memory Context

# [larinova] recent context, 2026-04-28 4:41pm GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (20,135t read) | 762,076t work | 97% savings

### Apr 26, 2026
S176 Larinova India OPD Landing Hero — WarpField canvas animation added and visually verified (Apr 26 at 2:50 PM)
S179 Larinova India OPD Landing — WarpField lifted to page level + hero layout fine-tuning (Apr 26 at 3:01 PM)
S182 Larinova Admin Issues UI — List, Detail, Status Updates, and Reply Chat (Apr 26 at 3:12 PM)
S183 Larinova Landing — Migrate all CTAs to survey-gated access model, fix build errors, push to GitHub, verify Vercel deployment (Apr 26 at 3:24 PM)
S252 Send a follow-up email to Gabriel's dad regarding company documents and action items from a previously sent email (Apr 26 at 3:25 PM)
### Apr 27, 2026
S501 Sarvam AI Streaming WebSocket API — Critical Gaps in Official Documentation (Apr 27 at 1:28 PM)
963 1:32p 🔵 Gmail API Access — Larinova OAuth Credentials Work as `gog` CLI Fallback
### Apr 28, 2026
1376 10:39a 🔵 Larinova Audio Transcription Pipeline — Codebase Architecture Mapped
1377 10:40a 🔵 Larinova Transcription — Inconsistent Noise Suppression Across getUserMedia Call Sites
1378 10:41a 🔵 Doctor Signup Flow — Slow API Performance and Redundant Email Verification Identified
1379 10:42a 🔵 Larinova App — Auth and Signup Route Architecture Mapped
1380 " 🔵 Doctor Signup Flow — Dual UX Defects Identified
1381 10:43a 🔵 Sarvam AI STT Docs — Index Page Only, Full Spec at llms-full.txt
1385 10:44a 🔵 Doctor Signup — Slow API Latency and Redundant Email Verification Flow Identified
1390 10:45a 🔵 Doctor Signup Flow — Slow API Response and Redundant Email Verification UX Bugs Identified
1391 " 🔵 Sarvam AI Streaming WebSocket API — Critical Gaps in Official Documentation
1392 " 🔵 Sarvam AI Saaras V3 — Benchmarks, Capabilities, and Streaming Modes Documented
S503 Doctor Signup — Dual UX Defects Identified: 20s Latency + Redundant Email Verification (Apr 28 at 10:45 AM)
1399 10:49a 🟣 Larinova STT — saaras:v3 Hot Fix Shipped (Step 1 of 3)
1400 " ⚖️ Larinova STT — Three-Step Upgrade Plan Decided
1402 10:50a 🔵 Larinova — Legacy AssemblyAI Realtime Route Still Present Alongside Sarvam Path
1403 " 🔵 Doctor Signup — Dual UX Defects Identified: 20s Latency + Redundant Email Verification
S507 User asked whether all problems are properly solved — confidence check on Larinova signup/invite fixes (Apr 28 at 10:50 AM)
1412 10:56a 🟣 Larinova — stt-proxy WebSocket Service Created at infra/stt-proxy
1413 10:57a 🔵 Sarvam WebSocket Wire Protocol — Audio Sent as Base64 JSON, Not Binary Frames
1414 10:58a 🔵 Sarvam Streaming STT — Confirmed Wire Format and Event Shapes
1415 " 🔵 Larinova App — No JWT Library Available, Only Supabase Crypto
1416 10:59a 🟣 Larinova — STT Proxy JWT Token Issuer Created (lib/stt/issue-token.ts)
1418 11:00a 🟣 Larinova — useSarvamStreamingSTT Hook Created with Full WebSocket + AudioWorklet Pipeline
1419 11:02a 🟣 Larinova — Streaming STT Feature Flag Added to TranscriptionViewStreaming
1420 " 🔵 Larinova Diarize Route — LLM-Based Speaker Labeling, Not Sarvam Batch API
1423 11:04a 🟣 Larinova STT Step 2 — Build Verified Clean, stt-token Route Confirmed Built
1429 11:06a 🟣 Larinova STT Step 2 — Shipped to main (commit ff9f1ab)
1433 11:10a 🔵 Password Field Shows Generic "Invalid input" Error Instead of Specific Validation Feedback
1435 " 🔵 Zod v4 Default Error Messages — Root Cause of "Invalid input" on Password Field
1437 11:11a 🔵 Larinova Auth — Validation i18n Keys Exist But Not Wired to Zod Schema; Missing Keys Added
1438 11:12a 🔴 Larinova Sign-Up Form — Generic "Invalid input" Replaced with Specific Validation Messages
1441 11:13a 🔴 Larinova Sign-Up Validation Fix Deployed to Production on Vercel
1443 11:14a 🔴 Larinova Auth — Invite Code Not Claimed on Pre-Verified Signup; Session Missing After admin.createUser
1444 11:15a 🔴 Larinova Invite Claim Fix Deployed to Production — Vercel Ready in 45s
1446 11:17a 🔵 Larinova Vault Supabase URL Points to Wrong Project (Rax Instance)
1447 " 🔵 Larinova Supabase — Correct Project ID afitpprgfsidrnrrhvzs, Doctor Row State, and Missing sent_at Column
1448 11:18a 🔴 Larinova — Stale Auth User and Doctor Row Deleted, Invite Code Reset for 1inchunitedefi@gmail.com
S509 Larinova Auth Migration — Remove passwords entirely, implement OTP-only for email login and direct OAuth for Google/providers (Apr 28 at 11:19 AM)
1449 11:23a ⚖️ Larinova Auth — Passwordless-Only Login Strategy Proposed
1451 11:47a 🔵 Hero Loop Video — Session Search Results in Larinova Project
1452 11:49a ⚖️ Password Flow Removal — Complete Elimination Decided
1453 11:52a ⚖️ Auth Flow Design Confirmed — OTP for Email, Direct OAuth for Gmail/Providers
1454 " 🔄 Larinova Signup Route Refactored — Password Auth Removed, OTP-Only Flow
1455 11:53a ✅ Sign-Up Page Form Schema Updated — Password Field Removed from Type and Zod Schema
1456 11:54a 🟣 Larinova Sign-Up Flow Fully Converted to OTP — Password Field Removed End-to-End
1457 " 🔄 Sign-In Page Step Type Simplified — Password and Set-Password Steps Removed
1458 11:55a 🔄 Sign-In Page — Password Auth Logic Fully Removed, Email Always Triggers OTP
1459 12:07p 🟣 verify-otp Page Upgraded — Dual-Mode Support for Email OTP and SMS OTP
1460 " 🟣 Larinova Passwordless Auth — Shipped to Production (commit deed255)
1461 12:08p 🟣 Larinova Passwordless Auth — Deployed and Verified on Production
1543 4:12p ⚖️ Demo Video Strategy — Planning Initiated for App Promo Video
1544 4:13p 🔵 Skills Registry — Promo Video Skills Discovered via `npx skills find`
S518 Mobile App Strategy — How to make the existing desktop web app available as a native iOS/Android app for doctors (Apr 28 at 4:14 PM)
1548 4:23p ✅ Global Tool Rules Updated — Skill Discovery Enforcement Added for Fast-Moving Platforms

Access 762k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>