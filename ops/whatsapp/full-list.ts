#!/usr/bin/env npx tsx
/**
 * Dump ALL chats as JSON (name + JID + isGroup + lastActivity + unreadCount).
 * No message fetches — so no waitForChatLoading failures.
 *
 * Usage:
 *   npm run full-list                     (all chats)
 *   npm run full-list -- --out=/tmp/chats.json
 */

import { writeFileSync } from "fs";
import { AUTH_DIR, CLIENT_ID, PUPPETEER_OPTS } from "./config";

type Args = Record<string, string | boolean>;
const args: Args = {};
for (const raw of process.argv.slice(2)) {
  if (!raw.startsWith("--")) continue;
  const eq = raw.indexOf("=");
  if (eq === -1) args[raw.slice(2)] = true;
  else args[raw.slice(2, eq)] = raw.slice(eq + 1);
}

const outPath = (args.out as string | undefined) ?? "";

const wwebjs: any = await import("whatsapp-web.js");
const { Client, LocalAuth } = wwebjs.default ?? wwebjs;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: CLIENT_ID, dataPath: AUTH_DIR }),
  puppeteer: PUPPETEER_OPTS,
});

client.on("qr", () => {
  console.error(`Session invalid. Run pair or check Marty.`);
  process.exit(1);
});

client.on("ready", async () => {
  try {
    const chats = await client.getChats();
    const out = chats
      .slice()
      .sort((a: any, b: any) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .map((c: any) => ({
        chatName: c.name ?? "(unnamed)",
        chatJid: String(c.id._serialized),
        isGroup: !!c.isGroup,
        unreadCount: c.unreadCount ?? 0,
        lastActivityIso: c.timestamp
          ? new Date(c.timestamp * 1000).toISOString()
          : null,
      }));
    const json = JSON.stringify(out, null, 2);
    if (outPath) {
      writeFileSync(outPath, json);
      console.error(`[full-list] wrote ${out.length} chats to ${outPath}`);
    } else {
      console.log(json);
    }
  } catch (err) {
    console.error(`Failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    setTimeout(async () => {
      try {
        await client.destroy();
      } catch {}
      process.exit(process.exitCode ?? 0);
    }, 1500);
  }
});

client.initialize();
