import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { razorpay } from "@/lib/razorpay";
import {
  getPlanId,
  isRazorpayConfigured,
  shouldSimulateRazorpay,
} from "@/lib/razorpay-helpers";

const bodySchema = z.object({
  interval: z.enum(["month", "year"]),
});

export async function POST(req: Request) {
  if (!isRazorpayConfigured() && !shouldSimulateRazorpay()) {
    return NextResponse.json(
      { error: "razorpay_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "invalid_request", code: "invalid_interval" },
      { status: 400 },
    );
  }

  const { interval } = parsed;

  const { data: doctor, error: doctorErr } = await supabase
    .from("larinova_doctors")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();

  if (doctorErr || !doctor) {
    return NextResponse.json({ error: "doctor_not_found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("larinova_subscriptions")
    .select("status, plan, razorpay_subscription_id, razorpay_customer_id")
    .eq("doctor_id", doctor.id)
    .maybeSingle();

  if (
    existing?.status === "active" &&
    existing.plan === "pro" &&
    existing.razorpay_subscription_id
  ) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  // Whitelisted alpha doctors are already Pro — no need to create a paid sub.
  if (existing?.status === "whitelisted") {
    return NextResponse.json(
      { error: "whitelisted_no_checkout" },
      { status: 409 },
    );
  }

  const planId = getPlanId(interval);
  if (!planId && !shouldSimulateRazorpay()) {
    return NextResponse.json(
      { error: "razorpay_not_configured", code: "plan_id_missing" },
      { status: 503 },
    );
  }

  const totalCount = interval === "month" ? 12 : 1;

  try {
    let customerId = existing?.razorpay_customer_id ?? null;

    if (shouldSimulateRazorpay()) {
      customerId = customerId ?? `cust_sim_${doctor.id.slice(0, 8)}`;
      const subId = `sub_sim_${Date.now()}`;
      await upsertSubscriptionRow(supabase, doctor.id, {
        razorpay_subscription_id: subId,
        razorpay_customer_id: customerId,
      });
      return NextResponse.json({
        subscription_id: subId,
        short_url: null,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_sim_key",
        simulated: true,
      });
    }

    if (!customerId) {
      try {
        // Razorpay SDK typings are `Promise<T> & void` on create; cast to any to extract `id`.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = (await (razorpay.customers.create as any)({
          name: doctor.full_name ?? user.email ?? "Larinova Doctor",
          email: user.email ?? undefined,
          fail_existing: 0,
          notes: {
            doctor_id: doctor.id,
            user_id: user.id,
          },
        })) as { id: string };
        customerId = customer.id;
      } catch (err) {
        console.error("[razorpay] customer.create failed", err);
        return NextResponse.json(
          { error: "razorpay_customer_failed" },
          { status: 502 },
        );
      }
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId!,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        doctor_id: doctor.id,
        user_id: user.id,
        doctor_name: doctor.full_name ?? "",
        interval,
      },
    });

    await upsertSubscriptionRow(supabase, doctor.id, {
      razorpay_subscription_id: subscription.id,
      razorpay_customer_id: customerId,
    });

    return NextResponse.json({
      subscription_id: subscription.id,
      short_url: subscription.short_url ?? null,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[razorpay] subscription.create failed", err);
    return NextResponse.json(
      { error: "razorpay_subscription_failed" },
      { status: 502 },
    );
  }
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function upsertSubscriptionRow(
  supabase: SupabaseClient,
  doctorId: string,
  fields: {
    razorpay_subscription_id: string;
    razorpay_customer_id: string;
  },
) {
  // Never write over a 'whitelisted' row.
  const { data: row } = await supabase
    .from("larinova_subscriptions")
    .select("id, status")
    .eq("doctor_id", doctorId)
    .maybeSingle();

  if (row?.status === "whitelisted") return;

  if (row) {
    await supabase
      .from("larinova_subscriptions")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  } else {
    await supabase.from("larinova_subscriptions").insert({
      doctor_id: doctorId,
      plan: "free",
      status: "active",
      ...fields,
    });
  }
}
