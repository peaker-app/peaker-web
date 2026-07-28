import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditAscentForm } from "@/components/features/ascents/EditAscentForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { noIndex } from "@/lib/seo";
import type { AscentResponse } from "@/types/api";

interface EditAscentPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const loadAscent = async (id: string): Promise<AscentResponse | undefined> => {
  try {
    return await serverFetch<AscentResponse>(endpoints.ascents.byId(id), {
      authenticated: true,
    });
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 404) {
      return undefined;
    }

    throw error;
  }
};

export async function generateMetadata({
  params,
}: EditAscentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ascentForm" });

  return { title: t("editTitle"), robots: noIndex() };
}

export default async function EditAscentPage({ params }: EditAscentPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ascent = await loadAscent(id);

  if (!ascent) {
    notFound();
  }

  const t = await getTranslations("ascentForm");
  const nav = await getTranslations("nav");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Breadcrumb
        steps={[
          { label: nav("myAscents"), href: "/dashboard/ascents" },
          { label: ascent.peakName, href: `/dashboard/ascents/${ascent.id}` },
          { label: t("editTitle") },
        ]}
      />
      <h1 className="text-3xl leading-relaxed font-semibold text-start">
        {t("editTitle")}
      </h1>
      <EditAscentForm ascent={ascent} />
    </div>
  );
}
