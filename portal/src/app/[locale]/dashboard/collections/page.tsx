import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { CollectionDialog } from "@/components/features/collections/CollectionDialog";
import { CollectionsGrid } from "@/components/features/collections/CollectionsGrid";
import { Button } from "@/components/ui/Button";
import { DialogTrigger } from "@/components/ui/Dialog";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { noIndex } from "@/lib/seo";
import type { CollectionSummaryResponse, PagedResponse } from "@/types/api";

const pageSize = 20;

interface CollectionsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: CollectionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });

  return { title: t("title"), robots: noIndex() };
}

const parsePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
};

const loadCollections = async (
  page: number,
): Promise<PagedResponse<CollectionSummaryResponse> | undefined> => {
  try {
    return await serverFetch<PagedResponse<CollectionSummaryResponse>>(
      `${endpoints.collections.root}?page=${page}&size=${pageSize}`,
      { authenticated: true },
    );
  } catch {
    return undefined;
  }
};

export default async function CollectionsPage({
  params,
  searchParams,
}: CollectionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const collections = await loadCollections(parsePage((await searchParams).page));
  const t = await getTranslations("collections");
  const common = await getTranslations("common.states");

  const newCollection = (
    <CollectionDialog
      idPrefix="createCollection"
      title={t("create.title")}
      submitLabel={t("create.submit")}
      trigger={
        <DialogTrigger asChild>
          <Button>{t("new")}</Button>
        </DialogTrigger>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {t("title")}
        </h1>
        {collections ? newCollection : null}
      </header>

      {!collections ? (
        <ErrorState message={common("errorTitle")} />
      ) : collections.items.length === 0 ? (
        <EmptyState title={t("empty.title")} description={t("empty.body")} />
      ) : (
        <CollectionsGrid collections={collections} />
      )}
    </div>
  );
}
