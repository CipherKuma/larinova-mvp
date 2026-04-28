"use client";

import { useEffect, useState } from "react";
import { Share, Plus, X, Download } from "lucide-react";

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "other";

const DISMISS_KEY = "larinova:install-prompt:dismissed-at";
const REPROMPT_AFTER_DAYS = 7;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as { standalone?: boolean }).standalone);
}

function shouldShow(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return true;
    const ageDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return ageDays > REPROMPT_AFTER_DAYS;
  } catch {
    return true;
  }
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (!shouldShow()) return;

    const p = detectPlatform();
    setPlatform(p);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as DeferredPrompt);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    if (p === "ios") {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  const triggerAndroidInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (!open) return null;
  if (platform === "other" && !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-[#15151b]/95 p-4 shadow-2xl backdrop-blur-xl mb-4 sm:mb-0">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <Download className="h-5 w-5 text-white/80" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Install Larinova</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/60">
              {platform === "ios"
                ? "Add Larinova to your Home Screen for faster, full-screen access."
                : "Install the app for faster, full-screen access — no browser bars."}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 text-white/40 transition hover:bg-white/5 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {platform === "ios" ? (
          <ol className="mt-3 space-y-2 text-xs text-white/70">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
                1
              </span>
              <span className="flex items-center gap-1">
                Tap
                <Share className="mx-0.5 inline h-3.5 w-3.5 text-sky-400" />
                in Safari&apos;s toolbar
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
                2
              </span>
              <span className="flex items-center gap-1">
                Choose
                <Plus className="mx-0.5 inline h-3.5 w-3.5 text-white/80" />
                <span className="font-medium text-white">
                  Add to Home Screen
                </span>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
                3
              </span>
              <span>Tap the Larinova icon to launch.</span>
            </li>
          </ol>
        ) : (
          <button
            onClick={triggerAndroidInstall}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#0b0b0f] transition hover:bg-white/90"
          >
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
