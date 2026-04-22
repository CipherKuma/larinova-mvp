"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "alpha_banner_dismissed_v1";

export default function AlphaWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;

    let cancelled = false;
    fetch("/api/subscription/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.subscription?.status === "whitelisted") {
          setVisible(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setVisible(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/10 px-4 py-2.5 text-sm text-foreground">
      <div className="flex-1">
        <span className="font-semibold">
          You&apos;re one of our first alpha doctors.
        </span>{" "}
        <span className="text-muted-foreground">
          Thank you — every note you dictate helps shape Larinova. Reply to any
          email with feedback.
        </span>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss alpha welcome banner"
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
