"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const WarpField = dynamic(
  () => import("./WarpField").then((mod) => mod.WarpField),
  { ssr: false },
);

export function DeferredWarpField({ className = "" }: { className?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setReady(true);
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1200 })
      : window.setTimeout(start, 600);

    return () => {
      if (typeof idle === "number") window.clearTimeout(idle);
      else window.cancelIdleCallback?.(idle);
    };
  }, []);

  if (!ready) return null;
  return <WarpField className={className} />;
}
