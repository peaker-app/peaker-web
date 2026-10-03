import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ConditionsSummary } from "@/components/features/ascents/ConditionsSummary";
import { PhotoGallery } from "@/components/features/ascents/PhotoGallery";
import {
  PeakLinkCard,
  peakCardFromAscent,
} from "@/components/features/peaks/PeakLinkCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { formatAltitude, parseDateOnly } from "@/lib/format";
import { alternatesFor } from "@/lib/seo";
import type {
  AscentResponse,
  PeakDetailResponse,
  PublicProfileResponse,
} from "@/types/api";

export const revalidate = 300;
export const generateStaticParams = () => [];

interface AscentPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const loadAscent = async (id: string): Promise<AscentResponse | undefined> => {
  try {
    return await serverFetch<AscentResponse>(endpoints.ascents.byId(id), {
      revalidate,
    });
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 404) {
      return undefined;
    }

    throw error;
  }
};

const loadAuthor = async (
  userId: string,
): Promise<PublicProfileResponse | undefined> => {
  try {
    return await serverFetch<PublicProfileResponse>(
      endpoints.profiles.byUserId(userId),
      { revalidate },
    );
  } catch {
    return undefined;
  }
};

const loadPeak = async (id: string): Promise<PeakDetailResponse | undefined> => {
  try {
    return await serverFetch<PeakDetailResponse>(endpoints.peaks.byId(id), {
      revalidate,
    });
  } catch {
    return undefined;
  }
};

export async function generateMetadata({
  params,
}: AscentPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const ascent = await loadAscent(id);

  if (!ascent) {
    return { robots: { index: false, follow: false } };
  }

  const author = await loadAuthor(ascent.userId);
  const t = await getTranslations({ locale, namespace: "ascents.public" });
  const title = t("metaTitle", {
    peak: ascent.peakName,
    climber: author?.displayName ?? "",
  });
  const firstPhoto = ascent.photos[0];

  return {
    title,
    alternates: alternatesFor(locale as Locale, `/ascents/${id}`),
    openGraph: {
      title,
      type: "article",
      ...(firstPhoto ? { images: [{ url: firstPhoto.secureUrl }] } : {}),
    },
  };
}

export default async function PublicAscentPage({ params }: AscentPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ascent = await loadAscent(id);

  if (!ascent) {
    notFound();
  }

  const [author, peak] = await Promise.all([
    loadAuthor(ascent.userId),
    loadPeak(ascent.peakId),
  ]);
  const t = await getTranslations("ascents.public");
  const header = await getTranslations("ascents.header");
  const notes = await getTranslations("ascents.notes");
  const units = await getTranslations("units");
  const format = await getFormatter();

  const date = parseDateOnly(ascent.ascentDate);
  const readableDate = date
    ? format.dateTime(date, { dateStyle: "long" })
    : ascent.ascentDate;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Breadcrumb
        steps={[{ label: t("breadcrumb") }, { label: ascent.peakName }]}
      />

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl leading-relaxed font-semibold text-start">
          {ascent.peakName}
        </h1>
        <p className="leading-relaxed text-muted-foreground text-start">
          {units("meters", {
            value: formatAltitude(locale as Locale, ascent.peakAltitudeMeters),
          })}
          {" · "}
          {header("date", { date: readableDate })}
        </p>
        {author ? (
          <Link
            href={`/climbers/${author.slug}`}
            className="text-start font-medium hover:underline"
          >
            {t("byClimber", { name: author.displayName })}
          </Link>
        ) : null}
      </header>

      <PhotoGallery photos={ascent.photos} peakName={ascent.peakName} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          {ascent.routeNotes ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg leading-relaxed font-semibold text-start">
                {notes("routeHeading")}
              </h2>
              <p
                dir="auto"
                className="max-w-prose leading-relaxed whitespace-pre-wrap text-start"
              >
                {ascent.routeNotes}
              </p>
            </section>
          ) : null}

          {ascent.companions ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg leading-relaxed font-semibold text-start">
                {notes("companionsHeading")}
              </h2>
              <p dir="auto" className="max-w-prose leading-relaxed text-start">
                {ascent.companions}
              </p>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <PeakLinkCard peak={peakCardFromAscent(ascent, peak)} />
          <ConditionsSummary conditions={ascent.conditions} />
        </div>
      </div>
    </div>
  );
}
