import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/dashboard",
          "/*/login",
          "/*/register",
          "/*/confirm-email",
          "/*/forgot-password",
          "/*/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
