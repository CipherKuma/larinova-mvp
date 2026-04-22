import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
// @ts-expect-error — next-pwa ships no types
import nextPwa from "next-pwa";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    { urlPattern: /^https?.*\/api\/.*$/, handler: "NetworkOnly" },
    {
      urlPattern: /\.(?:js|css|woff2?|png|svg|webp|ico)$/,
      handler: "StaleWhileRevalidate",
    },
  ],
  fallbacks: { document: "/offline" },
});

const nextConfig: NextConfig = {};

export default withPWA(withNextIntl(nextConfig));
