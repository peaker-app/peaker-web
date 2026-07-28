import { getTranslations } from "next-intl/server";
import { PeakCard } from "@/components/features/peaks/PeakCard";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import type { PagedResponse, PeakListItemResponse } from "@/types/api";

const featuredCount = 6;
const featuredRevalidateSeconds = 3600;

const loadFeatured = async (): Promise<PeakListItemResponse[]> => {
  try {
    const page = await serverFetch<PagedResponse<PeakListItemResponse>>(
      `${endpoints.peaks.list}?page=1&size=${featuredCount}`,
      { revalidate: featuredRevalidateSeconds },
    );

    return page.items;
  } catch {
    return [];
  }
};

export const FeaturedPeaks = async () => {
  const peaks = await loadFeatured();

  if (peaks.length === 0) {
    return null;
  }

  const t = await getTranslations("landing.featured");

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-16">
      <h2 className="text-2xl leading-relaxed font-semibold text-start">
        {t("heading")}
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {peaks.map((peak) => (
          <PeakCard key={peak.id} peak={peak} />
        ))}
      </ul>
      <Link href="/peaks" className="text-start font-medium hover:underline">
        {t("seeAll")}
      </Link>
    </section>
  );
};
