import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConditionsSummary } from "@/components/features/ascents/ConditionsSummary";
import { PhotoManager } from "@/components/features/ascents/PhotoManager";
import { VisibilityBadge } from "@/components/features/ascents/VisibilityBadge";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { formatAltitude, parseDateOnly } from "@/lib/format";
import { noIndex } from "@/lib/seo";
import type { AscentResponse } from "@/types/api";

interface AscentDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
}: AscentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const ascent = await loadAscent(id);

  return { title: ascent?.peakName, robots: noIndex() };
}

const failedCount = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default async function AscentDetailPage({
  params,
  searchParams,
}: AscentDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ascent = await loadAscent(id);

  if (!ascent) {
    notFound();
  }

  const pendingPhotos = failedCount((await searchParams).photosFailed);
  const t = await getTranslations("ascents.detail");
  const nav = await getTranslations("nav");
  const header = await getTranslations("ascents.header");
  const notes = await getTranslations("ascents.notes");
  const units = await getTranslations("units");
  const format = await getFormatter();

  const date = parseDateOnly(ascent.ascentDate);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        steps={[
          { label: nav("myAscents"), href: "/dashboard/ascents" },
          { label: ascent.peakName },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-3xl leading-relaxed font-semibold text-start">
            {ascent.peakName}
          </h1>
          <p className="leading-relaxed text-muted-foreground text-start">
            {units("meters", {
              value: formatAltitude(locale as Locale, ascent.peakAltitudeMeters),
            })}
            {" · "}
            {header("date", {
              date: date
                ? format.dateTime(date, { dateStyle: "long" })
                : ascent.ascentDate,
            })}
          </p>
          <VisibilityBadge value={ascent.visibility} />
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/ascents/${ascent.id}/edit`}>{t("edit")}</Link>
        </Button>
      </header>

      {pendingPhotos > 0 ? (
        <Alert variant="warning" role="status">
          <div className="flex flex-col gap-1">
            <AlertTitle>
              {t("pendingPhotos.title", { count: pendingPhotos })}
            </AlertTitle>
            <AlertDescription>{t("pendingPhotos.body")}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <PhotoManager
        ascentId={ascent.id}
        photos={ascent.photos}
        peakName={ascent.peakName}
      />

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
          <ConditionsSummary conditions={ascent.conditions} />
          <Link
            href={`/peaks/${ascent.peakId}`}
            className="text-start font-medium hover:underline"
          >
            {ascent.peakName}
          </Link>
        </div>
      </div>
    </div>
  );
}
