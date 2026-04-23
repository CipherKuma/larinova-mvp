# Larinova — MVP Web App

Core product at `app.larinova.com`. Next.js + Supabase.

## Stack
- Next.js (App Router)
- Supabase (auth + Postgres + RLS)
- Tailwind CSS
- next-intl for i18n
- Playwright for E2E
- Resend for transactional email

## Feature flow
Voice recording → transcription → SOAP notes → ICD-10 coding → prescription generation → PDF export.

## STT providers (by locale)
- **India**: Sarvam AI (primary)
- **Indonesia**: Deepgram (primary)
- **Fallbacks**: AssemblyAI, Speechmatics

## Key directories
- `app/` — App Router pages and route handlers
- `components/` — shared UI
- `lib/` — utilities, Supabase client, Resend client, STT adapters
- `messages/` — i18n JSON (`in.json`, `id.json`)
- `types/` — shared TS types including billing
- `supabase/` — migrations and seed data
- `tests/` — Playwright E2E
- `prompts/` — LLM prompts for SOAP generation, ICD-10, etc.

## Key files
- `types/billing.ts` — `FREE_TIER_LIMITS`, `PLAN_PRICES` by region. Billing source of truth.
- `lib/resend/email.ts` — email templates and Resend client. All transactional email goes through here.
- `messages/in.json` — India (English) translations
- `messages/id.json` — Indonesia (Bahasa) translations
- `i18n.ts` — next-intl config
- `playwright.config.ts` — E2E test config

## Clinical documents
Auto-generated: prescriptions, referral letters. PDF export via `html2pdf.js`. Templates live under `components/documents/` or `app/(app)/documents/`.

## Conventions
- Email sender: `hello@larinova.com` everywhere.
- All user input validated at route handlers with zod.
- No raw Supabase errors to client — always wrap with `{ error, code? }`.
- Prefer server components; `"use client"` only when needed.
- Always validate locale on server when rendering locale-specific content.

## Testing
- Playwright CLI sessions for auth-dependent flows — see `~/.claude/rules/testing-rules.md`.
- API routes: Bash + curl against local dev for happy path + one error case per endpoint.

## Migrations
- `supabase/migrations/` — numbered SQL. Use Supabase CLI to apply.
- `APPLY_MIGRATIONS.sql` — ad-hoc migration staging file.
