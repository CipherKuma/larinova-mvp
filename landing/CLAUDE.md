# Larinova — Landing

Marketing website at `larinova.com`. Next.js App Router, TypeScript, Tailwind.

## Stack
- Next.js (App Router)
- Tailwind CSS
- TypeScript
- Resend for transactional email (via `hello@larinova.com`)

## Locale routing
- `/in` — India (English)
- `/id` — Indonesia (Bahasa + English)

These routes are two market faces of the same Larinova OPD product. Keep India and Indonesia in the same app/landing architecture; handle differences through locale content, config, and market-specific copy, not separate branches.

## Key routes
- `/[locale]` — landing page
- `/[locale]/discovery-survey` — doctor survey form
- `/book` — book a call
- `/blog` — blog

## Key files
- `src/data/locale-content.ts` — **all** locale-specific copy for both locales, exported as `Record<Locale, LandingContent>`. Edit copy here, never inline in components.
- `src/app/api/discovery-survey/route.ts` — discovery survey API, sends confirmation email via Resend from `hello@larinova.com`.

## Conventions
- All CTA buttons link to `https://app.larinova.com` — never `#pricing` or `#`.
- Email sender: `hello@larinova.com` everywhere.
- No hardcoded copy in components — always pull from `locale-content.ts`.
- When adding a new section, add copy to both `in` and `id` entries in `locale-content.ts`; leave a `TODO:translate` marker if Indonesian copy isn't ready yet.
