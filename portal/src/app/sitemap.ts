import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { languageAlternates, siteUrl } from "@/lib/seo";
import type { PagedResponse, PeakListItemResponse } from "@/types/api";

export const revalidate = 86400;

const staticPaths = [
  "/",
  "/peaks",
  "/legal/notice",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/terms",
] as const;
const urlsPerSitemap = 50_000;
const catalogueBatchSize = 100;

const entryFor = (path: string): MetadataRoute.Sitemap[number] => ({
  url: `${siteUrl()}/${locales[0]}${path === "/" ? "" : path}`,
  lastModified: new Date(),
  alternates: { languages: languageAlternates(path) },
});

const localisedEntries = (path: string): MetadataRoute.Sitemap =>
  locales.map((locale) => ({
    ...entryFor(path),
    url: `${siteUrl()}/${locale}${path === "/" ? "" : path}`,
  }));

const fetchPeakPage = (page: number) =>
  serverFetch<PagedResponse<PeakListItemResponse>>(
    `${endpoints.peaks.list}?page=${page}&size=${catalogueBatchSize}`,
    { revalidate },
  );

const peakIdsForSitemap = async (id: number): Promise<string[]> => {
  const peaksPerSitemap = Math.floor(urlsPerSitemap / locales.length);
  const skip = id * peaksPerSitemap;
  const firstPage = Math.floor(skip / catalogueBatchSize) + 1;
  const lastPage = Math.ceil((skip + peaksPerSitemap) / catalogueBatchSize);
  const ids: string[] = [];

  for (let page = firstPage; page <= lastPage; page += 1) {
    const batch = await fetchPeakPage(page);
    ids.push(...batch.items.map((peak) => peak.id));

    if (page >= batch.totalPages) {
      break;
    }
  }

  return ids.slice(0, peaksPerSitemap);
};

export async function generateSitemaps(): Promise<{ id: number }[]> {
  try {
    const first = await fetchPeakPage(1);
    const peaksPerSitemap = Math.floor(urlsPerSitemap / locales.length);
    const count = Math.max(1, Math.ceil(first.totalCount / peaksPerSitemap));

    return Array.from({ length: count }, (_, id) => ({ id }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const index = Number(await id);
  const staticEntries = index === 0 ? staticPaths.flatMap(localisedEntries) : [];

  try {
    const ids = await peakIdsForSitemap(index);

    return [
      ...staticEntries,
      ...ids.flatMap((peakId) => localisedEntries(`/peaks/${peakId}`)),
    ];
  } catch {
    return staticEntries;
  }
}
