# Larinova Brand Assets

This folder is the source of truth for Larinova logo usage.

Use only these four files:

- `logos/dark-mode-icon-only.png` — icon-only mark for dark surfaces.
- `logos/dark-mode-icon-text.png` — icon plus wordmark for dark surfaces.
- `logos/light-mode-icon-only.png` — icon-only mark for light surfaces and app install icons.
- `logos/light-mode-icon-text.png` — icon plus wordmark for light surfaces.

Do not use older `logo-gen` experiments, generated SVG recreations, or one-off
copies as brand source files. App, landing, PWA, sales collateral, and portal
aliases should be regenerated from the four files above.

Before committing branding changes, run:

```bash
node scripts/verify-brand-assets.mjs
```
