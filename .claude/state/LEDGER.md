# Session Ledger

_Written pre-compact at 2026-04-27 13:00:48 IST. Read on post-compact so the next slice of the session has continuity._

## Branch + status
```
main
 M .claude/state/LEDGER.md
 M app/app/[locale]/(auth)/sign-up/page.tsx
 M app/app/admin/(authed)/surveys/AdminDashboard.tsx
 M app/app/api/admin/codes/invite/route.ts
?? .claude/scheduled_tasks.lock
?? app/app/[locale]/demo/
?? app/app/api/invite/details/
?? app/supabase/migrations/20260427100000_invite_codes_recipient_columns.sql
?? docs/superpowers/specs/2026-04-27-hero-loop-video-prompts-v2-cinematic-divein.md
?? docs/superpowers/specs/2026-04-27-hero-loop-video-prompts.md
```

## Recent commits (this branch)
```
1ba7621 fix(admin): lift html/body + fonts to root layout
b67989f fix(admin): wrap protected pages in (authed) route group
963cbe2 fix(admin): invite endpoint uses service-role for the codes insert
276c060 fix(email): rewrite invite-email opening to lead with the doctor's world, not the founder's
74eedd8 feat(invite): admin "Invite a doctor" sends a personal-letter welcome email with code
85ca948 chore(landing): drop "See it on your phone in 10 seconds" caption
e65fd28 fix(build): align /api/invite/redeem with email-at-invite-time flow
bd59536 feat(landing): wire Higgsfield hero loop into HeroIndia
38703d7 fix(proxy): admin gate must run BEFORE next-intl
5fdcb1a feat(admin): isolate admin from doctor flow — root /admin + dedicated sign-in
```

## Recently-modified files (last 60 min)
```
./landing/src/components/HeroIndia.tsx
./landing/src/data/locale-content.ts
./app/app/[locale]/access/AccessForm.tsx
./app/app/[locale]/layout.tsx
./app/app/[locale]/(auth)/sign-up/page.tsx
./app/app/[locale]/onboarding/page.tsx
./app/app/admin/(authed)/AdminSidebar.tsx
./app/app/admin/(authed)/doctors/[id]/page.tsx
./app/app/admin/(authed)/doctors/page.tsx
./app/app/admin/(authed)/layout.tsx
./app/app/admin/(authed)/surveys/AdminDashboard.tsx
./app/app/admin/(authed)/codes/InviteDoctorModal.tsx
./app/app/admin/(authed)/codes/page.tsx
./app/app/admin/(authed)/issues/page.tsx
./app/app/admin/(authed)/analytics/page.tsx
./app/app/admin/sign-in/AdminSignInForm.tsx
./app/app/admin/sign-in/page.tsx
./app/app/layout.tsx
./app/app/api/admin/check-email/route.ts
./app/app/api/admin/codes/invite/route.ts
./app/app/api/invite/redeem/route.ts
./app/app/api/invite/details/route.ts
./app/.next/fallback-build-manifest.json
./app/.next/types/routes.d.ts
./app/.next/types/validator.ts
./app/.next/images-manifest.json
./app/.next/required-server-files.json
./app/.next/build-manifest.json
./app/.next/server/middleware/middleware-manifest.json
./app/.next/server/pages-manifest.json
```

## Active spec (reference)
See `.claude/state/CURRENT_SPEC.md` — auto-injected on every prompt.
