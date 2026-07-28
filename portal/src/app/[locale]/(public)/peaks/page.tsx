import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PeakCard } from "@/components/features/peaks/PeakCard";
import { PeakFilters } from "@/components/features/peaks/PeakFilters";
import { PeakPagination } from "@/components/features/peaks/PeakPagination";
import { PeakSearchInput } from "@/components/features/peaks/PeakSearchInput";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { translateProblem, type MessageResolver } from "@/lib/api/problem";
import { alternatesFor, noIndex } from "@/lib/seo";
import type { PagedResponse, PeakListItemResponse } from "@/types/api";
import {
  activeFilterCount,
  pageSize,
  parsePeakQuery,
  type PeakQuery,
  type RawSearchParams,
} from "./searchParams";

interface PeaksPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PeaksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const query = parsePeakQuery(await searchParams);
  const t = await getTranslations({ locale, namespace: "peaks" });

  return {
    title: t("title"),
    description: t("search.help"),
    alternates: alternatesFor(locale as Locale, "/peaks"),
    ...(query.q || query.page > 1 ? { robots: noIndex() } : {}),
  };
}

const loadPeaks = (query: PeakQuery) => {
  const search = new URLSearchParams({
    page: String(query.page),
    size: String(pageSize),
  });

  for (const [key, value] of [
    ["q", query.q],
    ["country", query.country],
    ["region", query.region],
    ["minAltitude", query.minAltitude],
    ["maxAltitude", query.maxAltitude],
  ] as const) {
    if (value) {
      search.set(key, value);
    }
  }

  const path = query.q ? endpoints.peaks.search : endpoints.peaks.list;

  return serverFetch<PagedResponse<PeakListItemResponse>>(
    `${path}?${search.toString()}`,
    { revalidate: 300 },
  );
};

export default async function PeaksPage({
  params,
  searchParams,
}: PeaksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = parsePeakQuery(await searchParams);
  const t = await getTranslations("peaks");
  const errors = (await getTranslations("errors")) as unknown as MessageResolver;

  let results: PagedResponse<PeakListItemResponse> | undefined;
  let failure: string | undefined;

  try {
    results = await loadPeaks(query);
  } catch (error) {
    failure =
      error instanceof ApiError
        ? translateProblem(error.problem, errors)
        : errors("unknown");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl leading-relaxed font-semibold text-start">
        {t("title")}
      </h1>
      <PeakSearchInput defaultValue={query.q} showHelp />

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full border-border lg:w-72 lg:min-w-72 lg:border-e lg:pe-6">
          <h2 className="mb-4 text-lg leading-relaxed font-semibold text-start">
            {t("filters.heading")}
            {activeFilterCount(query) > 0
              ? ` (${activeFilterCount(query)})`
              : ""}
          </h2>
          <PeakFilters query={query} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          {failure ? (
            <ErrorState message={failure} />
          ) : (
            <>
              <p aria-live="polite" className="text-sm leading-relaxed text-start">
                {t("search.results", { count: results?.totalCount ?? 0 })}
              </p>

              {results && results.items.length > 0 ? (
                <>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {results.items.map((peak) => (
                      <PeakCard key={peak.id} peak={peak} />
                    ))}
                  </ul>
                  <PeakPagination
                    query={query}
                    totalPages={results.totalPages}
                  />
                </>
              ) : (
                <EmptyState
                  title={
                    query.q
                      ? t("search.empty", { query: query.q })
                      : t("catalogueEmpty")
                  }
                  description={
                    query.q ? t("search.emptyHint") : t("catalogueEmptyHint")
                  }
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
