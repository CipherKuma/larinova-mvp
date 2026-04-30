"use client";

import { useEffect, useRef } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<{
    destroy: () => void;
    raf: (time: number) => void;
  } | null>(null);

  useEffect(() => {
    // Bail out for screenshot capture and reduced-motion preferences —
    // Lenis-managed scroll confuses Playwright's fullPage walker and
    // overrides user motion settings.
    const wantsReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const inCaptureMode =
      typeof window !== "undefined" &&
      (new URLSearchParams(window.location.search).has("capture") ||
        document.documentElement.dataset.capture === "1");
    if (wantsReducedMotion || inCaptureMode) {
      return;
    }
    let disposed = false;
    let rafId = 0;
    let removeClickListener: (() => void) | undefined;

    const start = () => {
      void import("lenis").then(({ default: Lenis }) => {
        if (disposed) return;
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });
        lenisRef.current = lenis;

        function raf(time: number) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);

        const handleAnchorClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const anchor = target.closest(
            "a[href^='#']",
          ) as HTMLAnchorElement | null;
          if (!anchor) return;
          const hash = anchor.getAttribute("href");
          if (!hash || hash === "#") return;
          const el = document.querySelector(hash);
          if (!el) return;
          e.preventDefault();
          lenis.scrollTo(el as HTMLElement, { offset: -80, duration: 1.5 });
        };

        document.addEventListener("click", handleAnchorClick);
        removeClickListener = () =>
          document.removeEventListener("click", handleAnchorClick);
      });
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1800 })
      : window.setTimeout(start, 900);

    return () => {
      disposed = true;
      if (typeof idle === "number") window.clearTimeout(idle);
      else window.cancelIdleCallback?.(idle);
      cancelAnimationFrame(rafId);
      removeClickListener?.();
      lenisRef.current?.destroy();
    };
  }, []);

  return <>{children}</>;
}
