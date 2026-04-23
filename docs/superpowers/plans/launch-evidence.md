# Launch Evidence — India OPD Platform

> Captures Lighthouse scores, deploy verifications, and pilot smoke-test evidence required by §15 Definition of Done.

## PWA — §15.4

### Status: blocked (as of 2026-04-23)

**Local state**
- All PWA scaffolding committed (SHAs: `b8a4b1e`)
  - `app/public/manifest.webmanifest` (Larinova identity, #0b0b0f theme, standalone portrait)
  - `app/public/icons/` — 192 / 512 / 512-maskable / 180 Apple
  - `app/app/[locale]/layout.tsx` — `<link rel="manifest">`, apple-touch-icon, apple-mobile-web-app-*, theme-color
  - `app/next.config.ts` — wrapped with `next-pwa`: NetworkOnly for `/api/*`, StaleWhileRevalidate for js/css/woff2/png/svg/webp/ico, offline fallback at `/offline`
  - `app/app/offline/page.tsx` — minimal dark offline fallback
- Proxy matcher (`app/proxy.ts`) updated to exempt `manifest.webmanifest`, `sw.js`, `workbox-*.js`, `fallback*.js`, and the `/offline` route from intl + auth interception. Without this, intl middleware (`localePrefix: "always"`) 307-redirects `/manifest.webmanifest` → `/in/manifest.webmanifest`, which blocks installability.

**Blockers for Lighthouse audit**

1. **Production build fails** — pre-existing Turbopack + `openai@6.22.0` incompatibility at `app/app/api/openai/transcribe/route.ts`:
   ```
   ./node_modules/.../openai/client.mjs:16
   Export Skills doesn't exist in target module
   ```
   Not owned by this team (`app/app/api/**` excluded). Blocks service-worker generation (next-pwa only emits `sw.js` in production builds; dev builds have it disabled by design).

2. **PWA commits not on prod** — `main` is 16 commits ahead of `origin/main`; `b8a4b1e` is among them. Production `app.larinova.com`:
   - `GET /icons/icon-192.png` → 404
   - `GET /sw.js` → 307 → `/in/sw.js` (before matcher fix)
   - `GET /manifest.webmanifest` → 307 → `/in/manifest.webmanifest` (before matcher fix)

**Unblocks needed before Lighthouse audit**
- OpenAI transcribe route fixed (downgrade SDK, swap to Anthropic via claude-service per global rule, or scope the broken export) — owner: notify / api team
- Push `main` → `origin/main` after build green
- Vercel preview build succeeds, generates `sw.js` + `workbox-*.js` in `/public/`
- Run Lighthouse mobile against preview URL

**Target**: PWA ≥ 90. Record final score + screenshot in `/tmp/pwa-lighthouse/` and update this section.

### Lighthouse run log
_(empty — pending unblock)_

---

## Indonesia landing — §13.4

### Status: verified untouched

- `landing/src/app/[locale]/page.tsx` — gates India-specific components behind `isIndiaOpd = l === 'in'`. `id` locale still renders `Hero` / `HowItWorks` / `Features` / `Pricing` exactly as before. Only net change affecting `id`: `<Toaster position="bottom-right" theme="dark" />` mounted globally (locale-independent, non-visual in default state).
- `landing/src/data/locale-content.ts` — fa518b5 diff is 100% additive (zero removed lines); `id` entries preserved.
- Original shared components `Hero.tsx`, `Features.tsx`, `Pricing.tsx`, `HowItWorks.tsx`, and id-data (`faqs-id.ts`, `blog-posts-id.ts`) have no touches across the 8 India-OPD / PWA commits: `fa518b5`, `6d1b713`, `86a787c`, `f2fef6c`, `a1104c8`, `e5dec71`, `db69f0c`, `b8a4b1e`.

---

## Scroll narrative audit (supporting evidence)

- `/tmp/pwa-landing-audit/` — 13 screenshots: hero + 5 phase viewports on 1440×900 desktop and 390×844 iPhone 13; pricing card desktop.
- Desktop alternates visual L/R per phase (BOOK right → INTAKE left → PREP right → CONSULT left → FOLLOW-UP right). Mobile stacks text-over-visual, each phase full viewport with min-h-screen.
- GSAP ScrollTrigger fires reliably (line draw → num/label → verb/noun → desc → visual), accent color rotates per phase. Hero word-stagger + breathing gradient work.
