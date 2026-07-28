import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterAscentForm } from "@/components/features/ascents/RegisterAscentForm";
import type { SelectedPeak } from "@/components/features/ascents/PeakSearchCombobox";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { noIndex } from "@/lib/seo";
import type { PeakDetailResponse } from "@/types/api";

interface NewAscentPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: NewAscentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ascentForm" });

  return { title: t("newTitle"), robots: noIndex() };
}

const loadPreselected = async (
  peakId: string | undefined,
): Promise<SelectedPeak | undefined> => {
  if (!peakId) {
    return undefined;
  }

  try {
    const peak = await serverFetch<PeakDetailResponse>(
      endpoints.peaks.byId(peakId),
    );

    return {
      id: peak.id,
      name: peak.name,
      altitudeMeters: peak.altitudeMeters,
    };
  } catch {
    return undefined;
  }
};

export default async function NewAscentPage({
  params,
  searchParams,
}: NewAscentPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const raw = (await searchParams).peakId;
  const peakId = Array.isArray(raw) ? raw[0] : raw;
  const preselectedPeak = await loadPreselected(peakId);
  const t = await getTranslations("ascentForm");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl leading-relaxed font-semibold text-start">
        {t("newTitle")}
      </h1>
      <RegisterAscentForm preselectedPeak={preselectedPeak} />
    </div>
  );
}
