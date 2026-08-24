import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const tokenBearingPageHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const globalSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: globalSecurityHeaders },
      { source: "/:locale/confirm-email", headers: tokenBearingPageHeaders },
      { source: "/:locale/reset-password", headers: tokenBearingPageHeaders },
    ];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
