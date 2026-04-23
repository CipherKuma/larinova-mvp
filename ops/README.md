# larinova/ops

Non-technical subdir of the Larinova project — strategy, sales, collateral, pricing docs, and ops tooling (local Gmail MCP + WhatsApp CLI). Code lives one level up at the repo root.

See [CLAUDE.md](./CLAUDE.md) for full context and why this is a subdir.

## Quick start

```bash
# WhatsApp (one-time pairing)
cd whatsapp && npm install && npm run pair

# Build pricing strategy PDFs
cd docs && ./build.sh
```

## Gmail MCP setup

Edit `.mcp.json` — the `_gmail_disabled` key is a placeholder. To activate:

1. Create OAuth credentials at https://console.cloud.google.com → enable Gmail API → OAuth consent screen (testing mode) → add `gabrielantony56@gmail.com` as a test user
2. Download the OAuth client JSON → save as `./.gmail-credentials.json` (gitignored)
3. In `.mcp.json`, rename `_gmail_disabled` → `gmail`
4. Restart Claude Code **with CWD inside `ops/`**. First tool call opens a browser for consent; token caches to `./.gmail-token.json`.

## How MCP isolation works

Claude Code walks **up** from the current working directory to find `.mcp.json`. That means:

- CWD in `../app/` or `../landing/` → only root `.mcp.json` (Context7) is visible. Gmail/WhatsApp **not loaded**.
- CWD in `ops/` or deeper → `ops/.mcp.json` (Gmail) is visible; root one still applies.

So keep ops sessions rooted inside `ops/`, and code sessions at the repo root.
