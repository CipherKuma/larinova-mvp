#!/usr/bin/env npx tsx
/**
 * Send a WhatsApp message using the paired larinova-ops session.
 *
 * Usage:
 *   npm run send -- --to=919884009228@c.us --text="hello"
 *   npm run send -- --group="xaviour" --text="team update"
 *   npm run send -- --to=919884009228@c.us --file=/tmp/doc.pdf --caption="FYI"
 *
 * Flags:
 *   --to=<jid>         Target JID, e.g. 919884009228@c.us (note: @c.us suffix)
 *   --group=<match>    Case-insensitive substring match against group names
 *   --text=<string>    Text message body
 *   --file=<path>      Attachment path (image, pdf, etc.)
 *   --caption=<string> Optional caption for media
 *   --as-document      Force file to attach as document (not inline image)
 */

import { resolve } from "path";

type Args = Record<string, string | boolean>;
const args: Args = {};
for (const raw of process.argv.slice(2)) {
  if (!raw.startsWith("--")) continue;
  const eq = raw.indexOf("=");
  if (eq === -1) {
    args[raw.slice(2)] = true;
  } else {
    args[raw.slice(2, eq)] = raw.slice(eq + 1);
  }
}

const to = args.to as string | undefined;
const groupMatch = args.group as string | undefined;
const text = args.text as string | undefined;
const file = args.file as string | undefined;
const caption = args.caption as string | undefined;
const asDocument = args["as-document"] === true;

if (!to && !groupMatch) {
  console.error("Need --to=<jid> or --group=<match>");
  process.exit(1);
}
if (!text && !file) {
  console.error("Need --text=<string> or --file=<path>");
  process.exit(1);
}

const authDir = resolve(process.cwd(), "data", "whatsapp-auth");

const wwebjs: any = await import("whatsapp-web.js");
const { Client, LocalAuth, MessageMedia } = wwebjs.default ?? wwebjs;

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

client.on("auth_failure", (msg: string) => {
  console.error(`Auth failure: ${msg}`);
  process.exit(1);
});

client.on("ready", async () => {
  try {
    let target = to;
    if (!target && groupMatch) {
      const chats = await client.getChats();
      const groups = chats.filter((c: any) => c.isGroup);
      const match = groups.find((g: any) =>
        g.name?.toLowerCase().includes(groupMatch.toLowerCase()),
      );
      if (!match) {
        console.error(`No group matches "${groupMatch}". First 10 groups:`);
        for (const g of groups.slice(0, 10)) console.error(`  - ${g.name}`);
        process.exit(1);
      }
      target = match.id._serialized;
      console.log(`→ Resolved group "${match.name}" → ${target}`);
    }

    if (file) {
      const media = MessageMedia.fromFilePath(file);
      await client.sendMessage(target!, media, {
        caption: caption ?? text,
        sendMediaAsDocument: asDocument,
      });
      console.log(`✓ Sent ${file} to ${target}`);
    } else {
      await client.sendMessage(target!, text!);
      console.log(`✓ Sent text to ${target}`);
    }
  } catch (err) {
    console.error(`✗ Failed: ${(err as Error).message}`);
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
