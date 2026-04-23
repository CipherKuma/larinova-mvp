# WhatsApp CLI (larinova-ops)

Port of the `clan-runtime` WhatsApp setup — minimal `whatsapp-web.js` wrapper for sending messages from this ops project. Pairs via QR once, then session lives on disk.

## Setup (once)

```bash
cd ~/Documents/products/larinova-ops/whatsapp
npm install                      # installs whatsapp-web.js + Chromium
npm run pair                     # prints a QR in the terminal
```

On your phone: **WhatsApp → Settings → Linked Devices → Link a Device → scan QR**. Session persists to `./data/whatsapp-auth/` (gitignored).

## Use

```bash
# List your chats + JIDs
npm run list
npm run list -- --groups
npm run list -- --search=xaviour

# Send text to a DM (JID format: <countrycode><number>@c.us)
npm run send -- --to=919884009228@c.us --text="hello"

# Send to a group by substring match of its name
npm run send -- --group="xaviour" --text="team update"

# Send a file
npm run send -- --to=919884009228@c.us --file=/tmp/brief.pdf --caption="Today's brief" --as-document

# Send an image (inline)
npm run send -- --to=919884009228@c.us --file=~/Desktop/photo.jpg --caption="FYI"
```

## Notes

- **One concurrent session.** `whatsapp-web.js` only allows one process attached to a session at a time. If you also run the clan-runtime Marty agent against the same WhatsApp account, stop it before running these scripts — they use a different `clientId` (`larinova-ops` vs `marty`) so they pair as separate linked devices, but quitting the other helps avoid races on the same device slot on your phone.
- **JID format.** Direct messages are `<countrycode><number>@c.us` (no `+`, no spaces). Groups are `<long-id>@g.us`. `list` prints both.
- **Do NOT commit** `data/` — it holds the live auth token. Already in `.gitignore`.
- **Based on** `~/Documents/agents/clan-runtime/scripts/whatsapp-pair.ts` + `wa-multi-test.ts`.
