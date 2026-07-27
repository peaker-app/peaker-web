import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, siteUrl } from "@/lib/seo";

const publicPaths = ["/", "/peaks"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl()}/${locale}${path === "/" ? "" : path}`,
      lastModified: new Date(),
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
