import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Motivo: standalone solo interesa a la imagen de Docker; con él activado
// `next start` no sirve la aplicación y romperia los e2e locales.
const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
