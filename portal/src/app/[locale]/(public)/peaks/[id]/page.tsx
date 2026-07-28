import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PeakActions } from "@/components/features/peaks/PeakActions";
import { PeakFactsList } from "@/components/features/peaks/PeakFactsList";
import { PeakMap } from "@/components/features/peaks/PeakMap";
import { Badge } from "@/components/ui/Badge";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { countryName } from "@/lib/countries";
import { formatAltitude } from "@/lib/format";
import { detailZoom } from "@/lib/map";
import { localizedPeakName } from "@/lib/peakName";
import { alternatesFor } from "@/lib/seo";
import type { PeakDetailResponse } from "@/types/api";

export const revalidate = 86400;
export const generateStaticParams = () => [];

interface PeakPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const loadPeak = async (id: string): Promise<PeakDetailResponse | undefined> => {
  try {
    return await serverFetch<PeakDetailResponse>(endpoints.peaks.byId(id), {
      revalidate,
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
}: PeakPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const peak = await loadPeak(id);

  if (!peak) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations({ locale, namespace: "peakDetail" });
  const name = localizedPeakName(peak, locale as Locale);
  const country = peak.countryCode
    ? countryName(locale as Locale, peak.countryCode)
    : "";
  const title = country ? `${name} · ${country}` : name;
  const description = t("metaDescription", {
    name,
    altitude: formatAltitude(locale as Locale, peak.altitudeMeters),
  });

  return {
    title,
    description,
    alternates: alternatesFor(locale as Locale, `/peaks/${id}`),
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

const mountainJsonLd = (peak: PeakDetailResponse, name: string) => ({
  "@context": "https://schema.org",
  "@type": "Mountain",
  name,
  alternateName: peak.alternativeNames.map((alternative) => alternative.name),
  elevation: {
    "@type": "QuantitativeValue",
    value: peak.altitudeMeters,
    unitCode: "MTR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: peak.latitude,
    longitude: peak.longitude,
  },
  ...(peak.countryCode
    ? {
        address: {
          "@type": "PostalAddress",
          addressCountry: peak.countryCode,
        },
      }
    : {}),
});

export default async function PeakDetailPage({ params }: PeakPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const peak = await loadPeak(id);

  if (!peak) {
    notFound();
  }

  const t = await getTranslations("peakDetail");
  const nav = await getTranslations("nav");
  const name = localizedPeakName(peak, locale as Locale);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(mountainJsonLd(peak, name)),
        }}
      />

      <Breadcrumb
        steps={[
          { label: nav("peaks"), href: "/peaks" },
          { label: name },
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {name}
        </h1>
        {name === peak.name ? null : (
          <p className="leading-relaxed text-muted-foreground text-start">
            {t("canonicalName", { name: peak.name })}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <PeakFactsList peak={peak} />
        <div className="flex flex-col gap-6">
          <PeakMap
            points={[
              { id: peak.id, latitude: peak.latitude, longitude: peak.longitude },
            ]}
            zoom={detailZoom}
            className="h-72"
          />
          <PeakActions peakId={peak.id} locale={locale} />
        </div>
      </div>

      {peak.alternativeNames.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg leading-relaxed font-semibold text-start">
            {t("alternativeNames.heading")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {peak.alternativeNames.map((alternative) => (
              <li key={`${alternative.languageCode}-${alternative.name}`}>
                <Badge variant="outline">
                  <span lang={alternative.languageCode}>{alternative.name}</span>
                  {alternative.isOfficial ? (
                    <span className="text-muted-foreground">
                      {t("alternativeNames.official")}
                    </span>
                  ) : null}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
