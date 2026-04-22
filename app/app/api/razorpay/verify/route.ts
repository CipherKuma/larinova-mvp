import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  isRazorpayConfigured,
  shouldSimulateRazorpay,
  verifyOrderPaymentSignature,
  verifySubscriptionPaymentSignature,
} from "@/lib/razorpay-helpers";

// Accept either a subscription (sub_*) or order (order_*) payment callback.
const bodySchema = z
  .object({
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    razorpay_subscription_id: z.string().optional(),
    razorpay_order_id: z.string().optional(),
  })
  .refine((v) => Boolean(v.razorpay_subscription_id || v.razorpay_order_id), {
    message: "missing_subscription_or_order_id",
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
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (shouldSimulateRazorpay()) {
    return NextResponse.json({ ok: true, simulated: true });
  }

  const valid = parsed.razorpay_subscription_id
    ? verifySubscriptionPaymentSignature({
        paymentId: parsed.razorpay_payment_id,
        subscriptionId: parsed.razorpay_subscription_id,
        signature: parsed.razorpay_signature,
        keySecret,
      })
    : verifyOrderPaymentSignature({
        orderId: parsed.razorpay_order_id!,
        paymentId: parsed.razorpay_payment_id,
        signature: parsed.razorpay_signature,
        keySecret,
      });

  if (!valid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
