import { ChevronRightIcon, MountainIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { formatAltitude } from "@/lib/format";
import { peakThumbnail } from "@/lib/peakImage";
import { peakDisplayName } from "@/lib/peakName";
import type { AscentResponse, PeakDetailResponse } from "@/types/api";
import { type PeakCardItem, photoCredit, placeLabel } from "./PeakCard";

const thumbnailSize = 64;

export const peakCardFromAscent = (
  ascent: AscentResponse,
  peak: PeakDetailResponse | undefined,
): PeakCardItem =>
  peak ?? {
    id: ascent.peakId,
    name: ascent.peakName,
    altitudeMeters: ascent.peakAltitudeMeters,
    countryCode: null,
    region: null,
  };

export const PeakLinkCard = ({ peak }: { peak: PeakCardItem }) => {
  const t = useTranslations("peaks.link");
  const card = useTranslations("peaks.card");
  const credit = useTranslations("peakDetail.photoCredit");
  const peaks = useTranslations("peaks");
  const locale = useLocale() as Locale;

  const name = peakDisplayName(peak.name, (id) => peaks("unnamed", { id }));
  const altitude = formatAltitude(locale, peak.altitudeMeters);
  const place = placeLabel(locale, peak.countryCode, peak.region);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg leading-relaxed font-semibold text-start">
        {t("heading")}
      </h2>
      <div className="relative flex min-w-0 items-center gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
        {peak.imageUrl ? (
          <Image
            src={peakThumbnail(peak.imageUrl, thumbnailSize * 2)}
            alt=""
            title={photoCredit(peak, (key) => credit(key))}
            width={thumbnailSize}
            height={thumbnailSize}
            className="size-16 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
            <MountainIcon aria-hidden className="size-8 text-primary" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/peaks/${peak.id}`}
            dir="auto"
            aria-label={t("accessibleName", { name })}
            className="block wrap-break-word text-start font-medium after:absolute after:inset-0 hover:underline"
          >
            {name}
          </Link>
          <p className="wrap-break-word text-sm leading-relaxed text-muted-foreground">
            {card("altitude", { value: altitude })}
            {place ? ` · ${place}` : ""}
          </p>
          <p className="text-sm leading-relaxed font-medium text-primary">
            {t("action")}
          </p>
        </div>
        <ChevronRightIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100"
        />
      </div>
    </section>
  );
};
