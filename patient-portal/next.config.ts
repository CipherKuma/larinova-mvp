import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["noir", "noir.local", "100.100.148.117"],
  devIndicators: false,
};

export default nextConfig;
