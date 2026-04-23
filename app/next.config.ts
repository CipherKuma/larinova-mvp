import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {};

export default withSerwist(withNextIntl(nextConfig));
