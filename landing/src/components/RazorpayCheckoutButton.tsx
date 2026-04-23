"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

type BillingInterval = "month" | "year";

export interface RazorpayCheckoutButtonProps {
  interval: BillingInterval;
  label: string;
  className?: string;
  disabled?: boolean;
}

// Ported from app/components/razorpay-checkout.tsx for the marketing site.
// On the landing domain we do not share cookies with app.larinova.com, so the
// "create subscription" API call is not reachable. Behaviour contract:
//
//   - Visitor clicks Subscribe → we redirect to the app's signup with a
//     `next` query that reopens the upgrade flow after login.
//   - This matches the fallback in the OPD plan §6.2 while keeping the
//     component shape identical to the app's RazorpayCheckoutButton so the
//     two can converge later (once cross-domain auth exists).

const APP_ORIGIN = "https://app.larinova.com";

function buildRedirect(interval: BillingInterval): string {
  const nextPath = `/settings/billing?upgrade=${encodeURIComponent(interval)}`;
  const next = encodeURIComponent(nextPath);
  return `${APP_ORIGIN}/in/signup?next=${next}`;
}

export function RazorpayCheckoutButton({
  interval,
  label,
  className,
  disabled,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const onClick = useCallback(() => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const href = buildRedirect(interval);
      window.location.href = href;
    } catch (err) {
      toast.error("Couldn't open checkout. Please try again.");
      console.error("[razorpay-checkout] redirect failed", err);
      setLoading(false);
    }
  }, [disabled, interval, loading]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={
        className ??
        "block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
      }
    >
      {loading ? "Starting checkout…" : label}
    </button>
  );
}

export default RazorpayCheckoutButton;
