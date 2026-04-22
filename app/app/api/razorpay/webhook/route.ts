import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isRazorpayConfigured,
  razorpayTsToIso,
  shouldSimulateRazorpay,
  verifyWebhookSignature,
} from "@/lib/razorpay-helpers";

type RazorpayEventPayload = {
  event: string;
  // Razorpay sometimes emits a top-level `id` or an `id` inside `payload.subscription.entity`.
  id?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        plan_id?: string;
        current_end?: number;
        current_start?: number;
        end_at?: number;
        notes?: Record<string, unknown>;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        status?: string;
      };
    };
  };
};

type SubscriptionRow = {
  id: string;
  status: string | null;
  plan: string | null;
  razorpay_subscription_id: string | null;
  doctor_id: string;
};

export async function POST(req: Request) {
  if (!isRazorpayConfigured() && !shouldSimulateRazorpay()) {
    return NextResponse.json(
      { error: "razorpay_not_configured" },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const hdrs = await headers();
  const signature = hdrs.get("x-razorpay-signature");
  const razorpayEventId = hdrs.get("x-razorpay-event-id");

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!shouldSimulateRazorpay()) {
    if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }
  }

  let event: RazorpayEventPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventName = event.event;
  if (!eventName) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency: upsert into larinova_razorpay_events keyed by razorpay event id.
  const eventId =
    razorpayEventId ??
    event.id ??
    // fallback: hash of signature — last resort so we always have a PK
    signature ??
    `${eventName}:${Date.now()}`;

  const subId = event.payload?.subscription?.entity?.id ?? null;
  const payId = event.payload?.payment?.entity?.id ?? null;

  const { error: insertErr } = await supabase
    .from("larinova_razorpay_events")
    .insert({
      id: eventId,
      event: eventName,
      razorpay_subscription_id: subId,
      razorpay_payment_id: payId,
      payload: event,
    });

  if (insertErr) {
    // Unique-violation → already processed. Return 200 so Razorpay stops retrying.
    const code = (insertErr as { code?: string }).code;
    if (code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[razorpay-webhook] event insert failed", insertErr);
    // Fall through — do not block event processing on log failure.
  }

  try {
    switch (eventName) {
      case "subscription.activated":
        await onSubscriptionActivated(supabase, event);
        break;
      case "subscription.charged":
        await onSubscriptionCharged(supabase, event);
        break;
      case "subscription.halted":
      case "subscription.cancelled":
      case "subscription.completed":
        await onSubscriptionCancelled(supabase, event, eventName);
        break;
      case "subscription.pending":
      case "payment.failed":
        await onPaymentFailed(supabase, event);
        break;
      default:
        // Unknown / not-of-interest — log and 200.
        console.info(`[razorpay-webhook] ignoring event ${eventName}`);
    }
  } catch (err) {
    console.error("[razorpay-webhook] handler failed", eventName, err);
    return NextResponse.json(
      { error: "handler_failed", event: eventName },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

type AdminSupabase = ReturnType<typeof createAdminClient>;

async function findSubscriptionRow(
  supabase: AdminSupabase,
  razorpaySubId: string,
): Promise<SubscriptionRow | null> {
  const { data } = await supabase
    .from("larinova_subscriptions")
    .select("id, status, plan, razorpay_subscription_id, doctor_id")
    .eq("razorpay_subscription_id", razorpaySubId)
    .maybeSingle();
  return (data as SubscriptionRow | null) ?? null;
}

function shouldSkipWhitelisted(row: SubscriptionRow | null): boolean {
  // Never overwrite a whitelisted row with a Razorpay event unless the row has a
  // real subscription id (meaning the doctor actually completed Checkout).
  return row?.status === "whitelisted" && !row.razorpay_subscription_id;
}

async function onSubscriptionActivated(
  supabase: AdminSupabase,
  event: RazorpayEventPayload,
) {
  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) return;

  const row = await findSubscriptionRow(supabase, sub.id);
  if (shouldSkipWhitelisted(row)) return;

  // Interval comes from our notes payload (set in create-subscription).
  const interval =
    (sub.notes as { interval?: string } | undefined)?.interval === "year"
      ? "year"
      : "month";

  await supabase
    .from("larinova_subscriptions")
    .update({
      plan: "pro",
      status: "active",
      billing_interval: interval,
      razorpay_subscription_id: sub.id,
      current_period_end:
        razorpayTsToIso(sub.current_end) ?? razorpayTsToIso(sub.end_at),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", sub.id);

  await tryEmitInngest("payment.subscription_activated", {
    doctorId: row?.doctor_id,
    razorpaySubscriptionId: sub.id,
  });
}

async function onSubscriptionCharged(
  supabase: AdminSupabase,
  event: RazorpayEventPayload,
) {
  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) return;

  const row = await findSubscriptionRow(supabase, sub.id);
  if (shouldSkipWhitelisted(row)) return;

  await supabase
    .from("larinova_subscriptions")
    .update({
      status: "active",
      current_period_end:
        razorpayTsToIso(sub.current_end) ?? razorpayTsToIso(sub.end_at),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", sub.id);
}

async function onSubscriptionCancelled(
  supabase: AdminSupabase,
  event: RazorpayEventPayload,
  eventName: string,
) {
  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) return;

  const row = await findSubscriptionRow(supabase, sub.id);
  if (shouldSkipWhitelisted(row)) return;

  // Doctor keeps Pro access until current_period_end. We only flip status.
  await supabase
    .from("larinova_subscriptions")
    .update({
      status: "canceled",
      current_period_end:
        razorpayTsToIso(sub.current_end) ?? razorpayTsToIso(sub.end_at),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", sub.id);

  await tryEmitInngest("payment.subscription_cancelled", {
    doctorId: row?.doctor_id,
    razorpaySubscriptionId: sub.id,
    reason: eventName,
  });
}

async function onPaymentFailed(
  supabase: AdminSupabase,
  event: RazorpayEventPayload,
) {
  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) return;

  const row = await findSubscriptionRow(supabase, sub.id);
  if (shouldSkipWhitelisted(row)) return;

  await supabase
    .from("larinova_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", sub.id);

  await tryEmitInngest("payment.subscription_failed", {
    doctorId: row?.doctor_id,
    razorpaySubscriptionId: sub.id,
  });
}

async function tryEmitInngest(name: string, data: Record<string, unknown>) {
  // Team NotifyAgents owns `lib/inngest/client.ts`. Until it lands, stay quiet.
  // Use a runtime-computed specifier so TS doesn't demand the module resolve at compile time.
  try {
    const specifier = "@/lib/inngest/client";
    const mod = (await import(
      /* @vite-ignore */ /* webpackIgnore: true */ specifier
    ).catch(() => null)) as {
      inngest?: { send: (e: unknown) => Promise<unknown> };
    } | null;
    if (!mod?.inngest?.send) return;
    await mod.inngest.send({ name, data });
  } catch (err) {
    console.warn("[razorpay-webhook] inngest emission skipped", name, err);
  }
}
