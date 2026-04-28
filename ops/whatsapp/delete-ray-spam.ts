#!/usr/bin/env npx tsx
import { AUTH_DIR, CLIENT_ID, PUPPETEER_OPTS } from "./config";
import { readFileSync } from "fs";

const GROUP_JID = process.env.RAX_PMP_GROUP_JID ?? "120363423081039496@g.us";
const LIMIT = Number(process.env.DELETE_LIMIT ?? "120");
const SINCE_MINUTES = Number(process.env.DELETE_SINCE_MINUTES ?? "90");
const LOAD_ROUNDS = Number(process.env.DELETE_LOAD_ROUNDS ?? "80");
const STANZA_FILE = process.env.DELETE_STANZA_FILE;
const RAY_LID = process.env.RAY_LID ?? "275179259338765@lid";

const wwebjs: any = await import("whatsapp-web.js");
const { Client, LocalAuth } = wwebjs.default ?? wwebjs;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: CLIENT_ID, dataPath: AUTH_DIR }),
  puppeteer: PUPPETEER_OPTS,
});

client.on("qr", () => {
  console.error(`Session invalid at ${AUTH_DIR} (clientId=${CLIENT_ID}).`);
  process.exit(1);
});

client.on("auth_failure", (msg: string) => {
  console.error(`Auth failure: ${msg}`);
  process.exit(1);
});

function isRayAutomationText(body: string): boolean {
  return (
    /\bPISS-\d+\b/i.test(body) ||
    /tracked as/i.test(body) ||
    /investigating now/i.test(body) ||
    /ready for (your )?review/i.test(body) ||
    /pinpointed/i.test(body) ||
    /root cause/i.test(body) ||
    /fix worker/i.test(body)
  );
}

client.on("ready", async () => {
  let deleted = 0;
  let matched = 0;
  try {
    const explicitIds = STANZA_FILE
      ? readFileSync(STANZA_FILE, "utf8")
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((stanza) => `true_${GROUP_JID}_${stanza}_${RAY_LID}`)
      : [];

    if (explicitIds.length > 0) {
      matched = explicitIds.length;
      for (const id of explicitIds) {
        const ok = await revokeBySerializedId(id);
        if (ok) {
          deleted++;
          console.log(`deleted ${id}`);
        } else {
          console.error(`failed ${id}: cannot revoke`);
        }
      }
      console.log(`matched=${matched} deleted=${deleted}`);
      return;
    }

    const cutoffSeconds = Math.floor(Date.now() / 1000) - SINCE_MINUTES * 60;
    await client.interface.openChatWindow(GROUP_JID).catch(() => undefined);
    await client.syncHistory(GROUP_JID).catch(() => false);
    await new Promise((resolve) => setTimeout(resolve, 15_000));
    const candidates = await client.pupPage.evaluate(
      async ({ groupJid, limit, cutoff, rounds }) => {
        const chat =
          window.Store.Chat.get(groupJid) ||
          (await window.Store.Chat.find(groupJid));
        await window.Store.Cmd.openChatBottom({ chat }).catch(() => undefined);
        for (let i = 0; i < rounds; i++) {
          const loaded = await window.Store.ConversationMsgs.loadEarlierMsgs(
            chat,
            chat.msgs,
          ).catch(() => []);
          if (!loaded || loaded.length === 0) break;
          const oldest = chat.msgs
            .getModelsArray()
            .reduce((min: number, m: any) => Math.min(min, Number(m.t ?? min)), Date.now() / 1000);
          if (oldest < cutoff) break;
        }
        const allChatMsgs = chat.msgs.getModelsArray();
        const globalMsgs = window.Store.Msg.getModelsArray
          ? window.Store.Msg.getModelsArray()
          : [];
        const byId = new Map();
        for (const m of [...allChatMsgs, ...globalMsgs]) {
          if (m?.id?.remote === groupJid || m?.id?.remote?._serialized === groupJid) {
            byId.set(m.id?._serialized, m);
          }
        }
        const all = [...byId.values()];
        return all
          .filter((m: any) => {
            const id = String(m?.id?._serialized ?? "");
            const fromMe = !!m?.id?.fromMe || id.startsWith("true_");
            return fromMe && Number(m.t ?? 0) >= cutoff;
          })
          .slice(-limit)
          .map((m: any) => ({
            id: m.id?._serialized,
            body: m.body || m.caption || "",
            t: m.t,
          }));
      },
      {
        groupJid: GROUP_JID,
        limit: LIMIT,
        cutoff: cutoffSeconds,
        rounds: LOAD_ROUNDS,
      },
    );

    const idsToDelete = candidates
      .filter((m: { body: string }) => isRayAutomationText(String(m.body ?? "")))
      .map((m: { id: string }) => m.id)
      .filter(Boolean);
    matched = idsToDelete.length;

    for (const id of idsToDelete) {
      const ok = await revokeBySerializedId(id);
      if (ok) {
        deleted++;
        console.log(`deleted ${id}`);
      } else {
        console.error(`failed ${id}: cannot revoke`);
      }
    }
    console.log(`matched=${matched} deleted=${deleted}`);
  } catch (err) {
    console.error(`delete failed: ${(err as Error).message}`);
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

async function revokeBySerializedId(msgId: string): Promise<boolean> {
  return await client.pupPage.evaluate(
    async ({ groupJid, msgId }) => {
      const chat =
        window.Store.Chat.get(groupJid) ||
        (await window.Store.Chat.find(groupJid));
      const msg =
        window.Store.Msg.get(msgId) ||
        (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
      if (!msg) return false;
      const canRevoke =
        window.Store.MsgActionChecks.canSenderRevokeMsg(msg) ||
        window.Store.MsgActionChecks.canAdminRevokeMsg(msg);
      if (!canRevoke) return false;
      if (window.compareWwebVersions(window.Debug.VERSION, ">=", "2.3000.0")) {
        await window.Store.Cmd.sendRevokeMsgs(
          chat,
          { list: [msg], type: "message" },
          { clearMedia: true },
        );
      } else {
        await window.Store.Cmd.sendRevokeMsgs(chat, [msg], {
          clearMedia: true,
          type: msg.id.fromMe ? "Sender" : "Admin",
        });
      }
      return true;
    },
    { groupJid: GROUP_JID, msgId },
  );
}
