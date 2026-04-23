import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueJob } from "@/lib/jobs/enqueue";

/**
 * Gupshup WhatsApp webhook. Covers two event types we care about:
 *
 *  - `message`:        inbound patient reply → persist as larinova_messages
 *                      row (direction='in') and enqueue a job so the right
 *                      agent can respond.
 *  - `message-event`:  delivery/read receipt for an outbound message → update
 *                      status on the matching larinova_messages row.
 */

export interface GupshupInboundPayload {
  type: string;
  payload?: {
    id?: string;
    source?: string;
    type?: string;
    payload?: { text?: string; url?: string };
    sender?: { phone?: string; name?: string };
    destination?: string;
    // message-event fields
    gsId?: string;
    status?: string;
    reason?: string;
  };
}

export function verifyGupshupSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;
  const mac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(mac, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export async function handleGupshupEvent(
  payload: GupshupInboundPayload,
): Promise<{ kind: string; forwarded: boolean }> {
  const type = payload.type;
  if (type === "message") return handleInbound(payload);
  if (type === "message-event") return handleDelivery(payload);
  return { kind: type, forwarded: false };
}

async function handleInbound(
  payload: GupshupInboundPayload,
): Promise<{ kind: string; forwarded: boolean }> {
  const inner = payload.payload;
  if (!inner) return { kind: "message", forwarded: false };

  const fromPhone = inner.sender?.phone ?? inner.source ?? null;
  const body = inner.payload?.text ?? "";
  const providerMsgId = inner.id ?? null;
  if (!fromPhone || !body) return { kind: "message", forwarded: false };

  const supabase = createAdminClient();

  // Look up patient by phone (either phone or whatsapp match).
  const { data: patient } = await supabase
    .from("larinova_patients")
    .select("id")
    .or(`phone.eq.${normalise(fromPhone)},phone.eq.+${normalise(fromPhone)}`)
    .limit(1)
    .maybeSingle();

  await supabase.from("larinova_messages").insert({
    patient_id: patient?.id ?? null,
    channel: "whatsapp",
    direction: "in",
    body,
    provider: "gupshup",
    provider_msg_id: providerMsgId,
    recipient_phone: fromPhone,
    status: "replied",
  });

  // Route the inbound into the job queue so the worker picks it up. The
  // wellness agent handles followup.message_received. Messages not tied to
  // an open thread are a no-op for alpha (no "whatsapp.message_received"
  // consumer right now — left as DB row for future inbox review).
  const { data: thread } = patient?.id
    ? await supabase
        .from("larinova_follow_up_threads")
        .select("id,status")
        .eq("patient_id", patient.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle()
    : { data: null as null };

  if (thread?.id) {
    await enqueueJob("followup.message_received", {
      threadId: thread.id,
      body,
    });
  }

  return { kind: "message", forwarded: true };
}

async function handleDelivery(
  payload: GupshupInboundPayload,
): Promise<{ kind: string; forwarded: boolean }> {
  const inner = payload.payload;
  if (!inner) return { kind: "message-event", forwarded: false };
  const providerMsgId = inner.gsId ?? inner.id;
  if (!providerMsgId) return { kind: "message-event", forwarded: false };

  const status = mapStatus(inner.status);
  if (!status) return { kind: "message-event", forwarded: false };

  const supabase = createAdminClient();
  await supabase
    .from("larinova_messages")
    .update({
      status,
      delivered_at:
        status === "delivered" ? new Date().toISOString() : undefined,
      read_at: status === "read" ? new Date().toISOString() : undefined,
      error: inner.reason ?? null,
    })
    .eq("provider_msg_id", providerMsgId)
    .eq("provider", "gupshup");

  return { kind: "message-event", forwarded: true };
}

function mapStatus(raw?: string): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s === "sent" || s === "enqueued") return "sent";
  if (s === "delivered") return "delivered";
  if (s === "read") return "read";
  if (s === "failed" || s === "undelivered") return "failed";
  return null;
}

function normalise(s: string): string {
  return s.replace(/^\+/, "").replace(/\s/g, "");
}
