"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function isStandaloneDisplayMode() {
  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function PwaLaunchSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isStandaloneDisplayMode()) {
      document.documentElement.classList.remove("larinova-pwa-launch");
      setVisible(false);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.remove("larinova-pwa-launch");
      setVisible(false);
      return;
    }

    document.documentElement.classList.add("larinova-pwa-launch");
    const timer = window.setTimeout(() => {
      document.documentElement.classList.remove("larinova-pwa-launch");
      setVisible(false);
    }, 1450);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pwa-launch-splash" role="presentation">
      <div className="pwa-launch-splash__mark">
        <span className="pwa-launch-splash__ring" />
        <Image
          alt=""
          className="pwa-launch-splash__icon"
          height={104}
          priority
          src="/shared/dark-mode-icon-only.png"
          width={104}
        />
      </div>
      <div className="pwa-launch-splash__wordmark">Larinova</div>
      <div className="pwa-launch-splash__bar">
        <span />
      </div>
    </div>
  );
}
