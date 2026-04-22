import { NextResponse } from "next/server";
import {
  getRazorpayMode,
  isRazorpayConfigured,
  shouldSimulateRazorpay,
} from "@/lib/razorpay-helpers";

export async function GET() {
  return NextResponse.json({
    mode: getRazorpayMode(),
    configured: isRazorpayConfigured(),
    simulate: shouldSimulateRazorpay(),
  });
}
