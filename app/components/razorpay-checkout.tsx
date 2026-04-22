"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { BillingInterval } from "@/types/billing";

export interface RazorpayCheckoutButtonProps {
  interval: BillingInterval;
  label: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** Where to send the user after a successful payment handler callback. */
  successRedirect?: string;
  /** Where to send the user on 401 (default: `/in/login?next=<current>`). */
  loginRedirect?: string;
  /** Optional prefill — used by Razorpay Checkout to skip fields. */
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  disabled?: boolean;
}

// Public contract: Team Tier mounts this component on
// app/[locale]/(protected)/settings/billing/BillingClient.tsx,
// and Team PWA-Landing mounts it on landing/src/components/Pricing.tsx.

type CreateSubscriptionResponse = {
  subscription_id: string;
  short_url?: string | null;
  key_id?: string;
  simulated?: boolean;
};

// Window.Razorpay is declared as `any` in other components (upgrade-modal,
// BillingClient) for historical reasons. We stay compatible with that and
// type the constructor locally inside this file.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  theme?: { color: string };
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScriptPromise: Promise<void> | null = null;

/**
 * Dynamically load Razorpay Checkout.js (once per page).
 * Exported for testing.
 */
export function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window_unavailable"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("checkout_script_failed")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScriptPromise = null;
      reject(new Error("checkout_script_failed"));
    };
    document.body.appendChild(script);
  });

  return checkoutScriptPromise;
}

/**
 * Interpret the /api/razorpay/create-subscription response.
 * Returns a normalized result the component can act on. Exported for testing.
 */
export type CreateSubscriptionResult =
  | { kind: "ok"; body: CreateSubscriptionResponse }
  | { kind: "unauthorized" }
  | { kind: "not_configured" }
  | { kind: "already_subscribed" }
  | { kind: "whitelisted" }
  | { kind: "error"; code: string };

export async function interpretCreateSubscription(
  res: Response,
): Promise<CreateSubscriptionResult> {
  if (res.status === 401) return { kind: "unauthorized" };
  if (res.status === 503) return { kind: "not_configured" };
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    if (body?.error === "whitelisted_no_checkout") {
      return { kind: "whitelisted" };
    }
    return { kind: "already_subscribed" };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { kind: "error", code: body?.error ?? `http_${res.status}` };
  }
  const body = (await res.json()) as CreateSubscriptionResponse;
  return { kind: "ok", body };
}

export function RazorpayCheckoutButton({
  interval,
  label,
  className,
  variant = "default",
  successRedirect = "/in/settings/billing?upgraded=1",
  loginRedirect,
  prefill,
  disabled,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const interpreted = await interpretCreateSubscription(res);

      switch (interpreted.kind) {
        case "unauthorized": {
          const nextUrl =
            typeof window !== "undefined"
              ? encodeURIComponent(window.location.pathname)
              : "";
          const target = loginRedirect ?? `/in/login?next=${nextUrl}`;
          router.push(target);
          return;
        }
        case "not_configured":
          toast.error(
            "Payments not yet configured — contact hello@larinova.com",
          );
          return;
        case "already_subscribed":
          toast.info("You're already subscribed to Pro.");
          router.push(successRedirect);
          return;
        case "whitelisted":
          toast.success("You're on the alpha Pro plan — no checkout needed.");
          return;
        case "error":
          toast.error(
            `Couldn't start checkout (${interpreted.code}). Please try again.`,
          );
          return;
      }

      const { body } = interpreted;

      if (body.simulated) {
        toast.success("Simulated checkout: subscription created.");
        router.push(successRedirect);
        return;
      }

      if (!body.key_id) {
        toast.error("Razorpay key missing — contact hello@larinova.com");
        return;
      }

      await loadCheckoutScript();
      if (!window.Razorpay) {
        toast.error("Couldn't load Razorpay Checkout. Check your connection.");
        return;
      }

      const opts: RazorpayCheckoutOptions = {
        key: body.key_id,
        subscription_id: body.subscription_id,
        name: "Larinova",
        description:
          interval === "year"
            ? "Larinova Pro — Yearly"
            : "Larinova Pro — Monthly",
        theme: { color: "#0ea5e9" },
        prefill,
        handler: () => {
          // Subscription flow relies on the webhook for activation; this handler
          // just redirects the user back into the app with an `upgraded=1` flag.
          router.push(successRedirect);
        },
        modal: {
          ondismiss: () => {
            toast.message("Checkout closed. You can try again anytime.");
          },
        },
      };
      const rzp = new window.Razorpay(opts) as RazorpayInstance;
      rzp.open();
    } catch (err) {
      console.error("[razorpay-checkout] failed", err);
      toast.error("Couldn't start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [interval, loginRedirect, prefill, router, successRedirect]);

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      className={className}
      aria-busy={loading}
    >
      {loading ? "Starting checkout…" : label}
    </Button>
  );
}

export default RazorpayCheckoutButton;
