# Larinova — Patient Portal

Patient-facing app at `patient.larinova.com`. Low-friction: most patients never visit this — they get everything via WhatsApp/SMS/Email. The portal is only for document upload, appointment reschedule, and viewing outputs.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase SSR (`@supabase/ssr`) for magic-link auth — no password
- Shared Supabase DB with the main `app/` (same `NEXT_PUBLIC_SUPABASE_URL`)
- Vitest for tests
- Dev port: `3001` (main app runs on `3000`)

## Routes (5 only)
1. `/` — home: upcoming appointment, recent Rx, follow-up status
2. `/appointments/[id]` — detail + reschedule + cancel + document upload
3. `/appointments/[id]/intake` — intake form fill/edit
4. `/prescriptions/[id]` — view Rx + PDF download
5. `/documents` — list uploads + AI-requested pending

Plus: `/login` (magic-link) + `/auth/callback` (OTP exchange).

## Conventions
- Mobile-first, single-column, no chrome (no sidebar, no top nav).
- `max-w-md` on forms, `max-w-2xl` on content.
- Large tap targets (44px minimum).
- Dark theme only — same brand palette as the doctor app and landing (background `#0a0f1e`, primary `#10b981`, fonts Inter/Outfit/IBM Plex Mono). See `app/globals.css`.
- Patient portal belongs to the same India + Indonesia Larinova OPD product. English-only patient UX can ship first, but do not treat that as an India-only product, branch, or separate app.
- Auth gate lives in `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`).

## Data access
- Patient email is the JWT subject. Rows in `larinova_patients`, `larinova_appointments` (by `booker_email`), `larinova_prescriptions` (via patient_id), `larinova_patient_documents` (owned by Team NotifyAgents — may be stubbed).
- RLS policies required → see `RLS-POLICIES-NEEDED.md`.
- Never call main-app private APIs directly without CORS; prefer reading Supabase tables directly.

## What NOT to do
- Do not add authentication flows with passwords.
- Do not add stat cards, sidebars, or top navs — the user came to DO something, not read metrics.
- Do not touch `app/**` or `landing/**` from here.
