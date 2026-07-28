import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionHeader } from "@/components/features/collections/CollectionHeader";
import { CollectionPeaksSection } from "@/components/features/collections/CollectionPeaksSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { collectionLabel } from "@/lib/collections/label";
import { noIndex } from "@/lib/seo";
import type { CollectionDetailResponse } from "@/types/api";

const pageSize = 20;

interface CollectionDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const parsePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
};

const loadCollection = async (
  id: string,
  page: number,
): Promise<CollectionDetailResponse | undefined> => {
  try {
    return await serverFetch<CollectionDetailResponse>(
      `${endpoints.collections.byId(id)}?page=${page}&size=${pageSize}`,
      { authenticated: true },
    );
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 404) {
      return undefined;
    }

    throw error;
  }
};

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  const collection = await loadCollection(id, 1);

  return {
    title: collection ? collectionLabel(collection, t("defaultName")) : t("title"),
    robots: noIndex(),
  };
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: CollectionDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const collection = await loadCollection(id, parsePage((await searchParams).page));

  if (!collection) {
    notFound();
  }

  const t = await getTranslations("collections");

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        steps={[
          { label: t("title"), href: "/dashboard/collections" },
          { label: collectionLabel(collection, t("defaultName")) },
        ]}
      />

      <CollectionHeader collection={collection} />

      <CollectionPeaksSection collectionId={collection.id} page={collection.peaks} />
    </div>
  );
}
