import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NearbyPeaksView } from "@/components/features/peaks/NearbyPeaksView";
import { noIndex } from "@/lib/seo";

interface NearbyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: NearbyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "peaks.nearby" });

  return {
    title: t("title"),
    description: t("subtitle"),
    robots: noIndex(),
  };
}

export default async function NearbyPeaksPage({ params }: NearbyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("peaks.nearby");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {t("title")}
        </h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground text-start">
          {t("subtitle")}
        </p>
      </header>
      <NearbyPeaksView />
    </div>
  );
}
