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
- **Supabase project:** all three apps (`app/`, `landing/`, `patient-portal/`) use the same Supabase project, `afitpprgfsidrnrrhvzs` (`https://afitpprgfsidrnrrhvzs.supabase.co`). Verify this ref before any data mutation; `vziyntciabkelnaujliq` is not the Larinova app database. See `docs/ENVIRONMENT.md`.
- **Env vars:** for Larinova Supabase, prefer the vault keys with `_LARINOVA` suffix and map them to the app's expected env names. Do not inject the generic `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` into Larinova without verifying. Run `node scripts/verify-supabase-env.mjs` before any data mutation.
- **Vercel verify:** after push, `vercel ls larinova-app` / `vercel ls larinova-landing` / `vercel ls larinova-patient` to check Ready. A fix is only done when verified on the live URL, impersonated as a non-admin user.
- **Supabase migrations:** use `supabase db push` from the `app/` directory. The `APPLY_MIGRATIONS.sql` is a staging file, not authoritative.
- **Shadcn components:** use the `shadcn` skill. New components go via the CLI, not hand-written.
- **Locale copy edits:** `landing/` copy → `src/data/locale-content.ts` (both `in` + `id` entries). `app/` copy → `messages/in.json` or `messages/id.json`.
- **WhatsApp send verification:** after any WhatsApp send, verify the target chat itself before claiming success. For Marty/personal sends, query `~/Library/Group Containers/group.net.whatsapp.WhatsApp.shared/ChatStorage.sqlite` and, for browser fallback, capture a WhatsApp Web screenshot. `whatsapp-web.js` can report progress while a UI fallback still failed; do not trust an intermediate log alone.
- **WhatsApp Web current UA:** if `ops/whatsapp` hangs before `ready` or shows "WhatsApp works with Google Chrome 85+", set/use a modern Chrome user agent from `ops/whatsapp/config.ts`; the old `whatsapp-web.js` default Chrome 101 UA is unreliable in this environment.
- **Larinova bank route:** for the first company current account, use **ICICI only**. Ignore HDFC, Kotak, RazorpayX-as-primary, and other inbound bank-account offers unless Gabriel explicitly changes the bank choice.

## Things to avoid

- Do **not** install Playwright MCP or Chrome DevTools MCP. `playwright-cli-sessions` covers both. See `~/Documents/infra/playwright-cli-sessions/docs/DEVTOOLS-PARITY-PROPOSAL.md` for the extension plan if coverage gaps emerge.
- Do **not** read `.env.master` directly — always go through `inject.sh`.
- Do **not** commit anything under `.next/`, `node_modules/`, `test-results/`, or any `*.tsbuildinfo`.
- Do **not** use `<input type="date">` or `<input type="number">` — see `~/.claude/rules/ui-rules.md` (use shadcn Calendar + text input with regex parse).
- Do **not** put search icons inside search inputs — see ui-rules.md.
- Do **not** add stat-card dashboards — lead with the primary action. See ui-rules.md.
- Do **not** modify migrations that have already shipped to prod. Create a new forward migration instead.
- Do **not** hardcode copy — always pull from `locale-content.ts` (landing) or `messages/*.json` (app).
- Do **not** address Balachandar Seeman casually ("bro"). He is an elder goodwill advisor for Larinova; use "Seeman Sir" and keep WhatsApp follow-ups concise, respectful, and context-aware.
- Do **not** assume Mac WhatsApp `@lid` chat IDs work cleanly with `whatsapp-web.js` sends. If a `@lid` recipient hangs, use WhatsApp Web search by contact name and verify the sent message in the chat.
- Do **not** use affectionate or overly formal legacy greetings/signoffs in Gabriel's outbound comms. Avoid "Dear", "Love", "Warm regards", etc. Use concise, direct professional language such as "Hi <name>," or start with context directly.

<claude-mem-context>
# Memory Context

# [larinova] recent context, 2026-05-05 8:38pm GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (22,723t read) | 1,165,124t work | 98% savings

### Apr 26, 2026
S183 Larinova Landing — Migrate all CTAs to survey-gated access model, fix build errors, push to GitHub, verify Vercel deployment (Apr 26 at 3:24 PM)
S252 Send a follow-up email to Gabriel's dad regarding company documents and action items from a previously sent email (Apr 26 at 3:25 PM)
### Apr 27, 2026
S501 Sarvam AI Streaming WebSocket API — Critical Gaps in Official Documentation (Apr 27 at 1:28 PM)
### Apr 28, 2026
S503 Doctor Signup — Dual UX Defects Identified: 20s Latency + Redundant Email Verification (Apr 28 at 10:45 AM)
S507 User asked whether all problems are properly solved — confidence check on Larinova signup/invite fixes (Apr 28 at 10:50 AM)
S509 Larinova Auth Migration — Remove passwords entirely, implement OTP-only for email login and direct OAuth for Google/providers (Apr 28 at 11:19 AM)
S518 Mobile App Strategy — How to make the existing desktop web app available as a native iOS/Android app for doctors (Apr 28 at 12:08 PM)
S554 Gmail OAuth Tokens Found in Larinova Ops — Two Accounts Authenticated (Apr 28 at 4:14 PM)
### Apr 30, 2026
S563 WhatsApp SQLite Mirror — Balachandar Seeman Conversation Accessible (Apr 30 at 10:10 AM)
S584 Larinova sign-in page UX redesign — handle invite-only access clearly for both returning doctors and new users needing invite codes (Apr 30 at 4:13 PM)
### May 1, 2026
2158 5:59p 🔵 Vercel CLI Not Authenticated on M4 — Deployment Polling Fails Without --token Flag
2159 6:00p 🔴 Vercel CLI Auth Fixed — Use --token Flag with VERCEL_TOKEN from Vault
2160 6:14p 🔵 Larinova Invite Code System — Full Code Path Mapped Across Auth, Admin, and Redeem Flows
2161 6:15p 🔵 Larinova Invite Flow — Three-Route Architecture: accept → claim → redeem
2162 " 🔵 verify-supabase-env.mjs — Env Files OK but .vercel/project.json Missing for All Three Apps
2164 6:19p 🟣 Larinova Sign-In — Pending Doctor Invite State Distinguished from Not-Recognized
2171 6:23p ⚖️ Larinova Demo Video Strategy — Multi-Tool Production Plan Initiated
2172 6:24p 🔵 Larinova Private Limited — Bank Account Setup Session Scoped
2173 6:41p 🔵 Larinova — Doctor Onboarding Flow: Multiple Bugs and UX Issues Identified
2174 6:42p 🔵 Larinova — Root Cause: invite_code_claimed_at Null Despite Account Creation
2175 " 🔵 Larinova — Invite Email Contains No Visible Invite Code in Body
2176 " 🔵 Larinova — Invite Claim Architecture: claim_invite_code RPC Flow Mapped
2177 6:43p 🔴 Larinova — Doctor Onboarding: Invite Claim Now Atomic at Signup, Self-Healing at Login
2178 6:44p 🔴 Larinova — Production Data Repair: Gabriel's Stuck invite_code_claimed_at Backfilled
2179 " 🔴 Larinova — Invite Flow Fixes Verified: check-email Returns Correct State, Sign-in UI Shows Inline Code Field
2180 6:45p 🔴 Larinova — Invite Claim Now Upgrades Subscription to Pro at Signup and Self-Heal Time
2181 6:46p 🔴 Larinova — Production check-email Confirmed Fixed for gabriel@raxgbc.co.in
2182 6:47p ✅ Larinova — Invite Flow Fix Deployed to Vercel Production
2183 6:48p 🔴 Larinova — Production Login Flow Verified: gabriel@raxgbc.co.in Reaches OTP Step Without Pending Gate
2184 7:05p 🔵 Larinova Onboarding — Mobile Status Bar Overlap: No Safe-Area Insets Applied
2185 7:06p 🔵 Larinova Onboarding — Full Component Audit: Safe-Area Gap Confirmed Across Entire Stack
2186 7:07p 🔴 Larinova Onboarding — Mobile Safe-Area Fix Committed and Pushed
2187 7:08p 🔴 Larinova Onboarding Safe-Area Fix — Deployed to Production on Vercel
### May 2, 2026
2303 5:09p 🟣 Jakarta Luxury Car Rental Outreach — Audi A6/A8 Self-Drive Hunt Initiated
2305 5:11p 🟣 Jakarta Luxury Car Rental Outreach — Audi A6/A8 Self-Drive Inquiry
2307 5:13p 🟣 Jakarta Luxury Car Rental Outreach — Audi A6/A8 Self-Drive Hunt Initiated
2310 5:14p 🟣 Jakarta Audi Rental WhatsApp Blast Executed via Larinova Ops CLI
2314 5:16p 🔵 whatsapp-web.js Bulk Inline-Eval Send Hung — Fallback to send.ts CLI Per-Message
2321 5:18p 🟣 WhatsApp URL Scheme + osascript Fallback — 7 Send Attempts Dispatched to Jakarta Rental Vendors
2327 5:22p 🔵 Jakarta Rental Vendor Responses — All 3 Early Replies Declined Audi Availability
2328 " 🟣 Follow-Up WhatsApp Messages Sent to 3 Declining Vendors — Partner Sourcing + BMW/Mercedes Ask
2329 5:23p 🔵 Ryan Rent Car Numbers Received Blank Messages — URL Scheme Sent Empty Text
2345 5:38p 🔵 Audi A6/A8 Jakarta Rental Outreach — Status After First Wave
2346 5:47p 🔵 WhatsApp URL Scheme + osascript Send — Not Reflected in SQLite Mirror
2347 5:48p 🔵 Audi Rental Lead Confirmed — +62 813-8443-7296 Has Availability
2348 5:49p 🔵 Audi Rental Outreach — Three Key Status Updates Confirmed
### May 5, 2026
3321 2:40p 🔵 Larinova cmux Workspace Topology — Full Tab Map Confirmed
3322 " 🔵 Larinova Ops — 18 cmux Surfaces Each Assigned a Company Formation Track
3323 " 🔵 Larinova DPIIT Recognition — 7 Remaining Blockers Identified
3324 " ✅ Larinova INC-20A Checklist — Rs. 10,000 Capital and Nameboard Photos Added
3325 " 🔵 Larinova ADT-1 — CS Murugan Replied May 2 with First-Auditor Appointment Docs
3326 " 🔵 Larinova Funding — India Grants Pipeline Ranked, SISFS + DPIIT as Critical Path
3327 " 🔵 Larinova DPDP / Insurance Gap — Existing Policy 328971012 Is LIC Jeevan Labh, Not PI/Cyber Coverage
3328 " 🔵 Larinova GST/IEC/Udyam — Pre-Bank vs Post-Bank Dependency Split Documented
3334 2:42p 🔵 gog CLI Gmail OAuth Client Deleted — Cannot Use gog for Gmail Searches
3335 " 🔵 Larinova ADT-1 — Murugan Email Thread Confirmed, CA Innocent Sent Signed Consent PDF
3345 2:46p 🔴 Larinova Bank Account — HDFC/Kotak Outreach Sent Without Authorization, Immediately Retracted
3346 " ✅ Larinova OPERATIONS_TRACKER.md — Full May 2–5 Activity Backfill Completed
3349 2:47p ✅ Larinova ICICI-Only Bank Rule Propagated to All 5 Source-of-Truth Docs
3352 2:49p ✅ ops/company-docs/02-bank.md Restructured to Prevent Downstream Rails Being Mistaken for Bank Alternatives

Access 1165k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
