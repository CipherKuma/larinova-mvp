#!/usr/bin/env npx tsx
/**
 * List recent WhatsApp chats (groups + DMs) with their JIDs.
 * Useful for discovering the JID to pass to send.ts.
 *
 * Usage:
 *   npm run list                    (top 30 by recent activity)
 *   npm run list -- --groups        (groups only)
 *   npm run list -- --limit=50
 *   npm run list -- --search=xaviour
 */

import { resolve } from "path";

type Args = Record<string, string | boolean>;
const args: Args = {};
for (const raw of process.argv.slice(2)) {
  if (!raw.startsWith("--")) continue;
  const eq = raw.indexOf("=");
  if (eq === -1) args[raw.slice(2)] = true;
  else args[raw.slice(2, eq)] = raw.slice(eq + 1);
}

const groupsOnly = args.groups === true;
const limit = Number(args.limit ?? 30);
const search = (args.search as string | undefined)?.toLowerCase();

const authDir = resolve(process.cwd(), "data", "whatsapp-auth");

const wwebjs: any = await import("whatsapp-web.js");
const { Client, LocalAuth } = wwebjs.default ?? wwebjs;

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

client.on("qr", () => {
  console.error("Session invalid. Run `npm run pair` first.");
  process.exit(1);
});

client.on("ready", async () => {
  try {
    const chats = await client.getChats();
    let filtered = groupsOnly ? chats.filter((c: any) => c.isGroup) : chats;
    if (search) {
      filtered = filtered.filter((c: any) =>
        (c.name ?? "").toLowerCase().includes(search),
      );
    }
    filtered = filtered.slice(0, limit);

    console.log("");
    console.log(`TYPE  | JID                                | NAME`.padEnd(80));
    console.log("".padEnd(80, "-"));
    for (const c of filtered) {
      const type = c.isGroup ? "GROUP" : "DM   ";
      const jid = String(c.id._serialized).padEnd(34);
      console.log(`${type} | ${jid} | ${c.name ?? "(unnamed)"}`);
    }
    console.log("");
    console.log(`Total: ${filtered.length}`);
  } catch (err) {
    console.error(`Failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    setTimeout(async () => {
      try {
        await client.destroy();
      } catch {}
      process.exit(process.exitCode ?? 0);
    }, 1000);
  }
});

client.initialize();
