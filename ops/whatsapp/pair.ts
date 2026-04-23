#!/usr/bin/env npx tsx
/**
 * WhatsApp QR pairing for larinova-ops.
 *
 * Usage:
 *   cd larinova-ops/whatsapp
 *   npm install        (first run only)
 *   npm run pair
 *
 * On your phone: WhatsApp → Settings → Linked Devices → Link a Device → scan QR.
 * Session persists to ./data/whatsapp-auth/. Do not commit that directory.
 */

import { mkdirSync } from "fs";
import { resolve } from "path";

const authDir = resolve(process.cwd(), "data", "whatsapp-auth");
mkdirSync(authDir, { recursive: true });

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  larinova-ops WhatsApp pairing");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Auth dir: ${authDir}`);
console.log("");

const wwebjs: any = await import("whatsapp-web.js");
const { Client, LocalAuth } = wwebjs.default ?? wwebjs;
const qrcode: any = await import("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "larinova-ops", dataPath: authDir }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  },
});

let qrShown = 0;

client.on("qr", (qr: string) => {
  qrShown++;
  process.stdout.write("\x1b[2J\x1b[H");
  console.log(`  QR attempt ${qrShown} — scan within ~30s`);
  console.log("");
  (qrcode.default ?? qrcode).generate(qr, { small: true });
  console.log("  ^^ WhatsApp → Settings → Linked Devices → Link a Device");
  console.log("");
});

client.on("authenticated", () => {
  console.log("\n  Authenticated. Finalizing...");
});

client.on("auth_failure", (msg: string) => {
  console.error(`\n  Auth failure: ${msg}`);
  process.exit(1);
});

client.on("ready", async () => {
  const info = client.info;
  console.log("\n  READY. Session saved.");
  console.log(`  Phone: ${info?.wid?._serialized ?? "?"}`);
  console.log(`  Name:  ${info?.pushname ?? "?"}`);
  console.log("");
  console.log("  Next: npm run list  (to see your chats)");
  console.log('        npm run send -- --to=<jid> --text="hello"');

  setTimeout(async () => {
    try {
      await client.destroy();
    } catch {}
    process.exit(0);
  }, 3000);
});

client.on("disconnected", (reason: string) => {
  console.error(`\n  Disconnected: ${reason}`);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("\n  Cancelled.");
  try {
    await client.destroy();
  } catch {}
  process.exit(0);
});

client.initialize();
console.log(
  "  Booting whatsapp-web.js (first run downloads Chromium; 30–60s)...",
);
console.log("");
