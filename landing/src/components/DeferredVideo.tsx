"use client";

import { useEffect, useState, type VideoHTMLAttributes } from "react";

interface DeferredVideoProps extends Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "src"
> {
  src: string;
  delayMs?: number;
}

export function DeferredVideo({
  src,
  delayMs = 700,
  className,
  ...props
}: DeferredVideoProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setReady(true);
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(load, { timeout: delayMs })
      : window.setTimeout(load, delayMs);

    return () => {
      if (typeof idle === "number") window.clearTimeout(idle);
      else window.cancelIdleCallback?.(idle);
    };
  }, [delayMs]);

  if (!ready) {
    return (
      <div
        aria-hidden
        className={`h-full w-full animate-pulse bg-white/[0.04] ${className ?? ""}`}
      />
    );
  }

  return (
    <video src={src} className={className} preload="metadata" {...props} />
  );
}
