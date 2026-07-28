import type { Locale } from "@/i18n/config";
import type { PeakDetailResponse } from "@/types/api";

export const localizedPeakName = (
  peak: Pick<PeakDetailResponse, "name" | "alternativeNames">,
  locale: Locale,
): string =>
  peak.alternativeNames.find(
    (name) => name.languageCode === locale && name.isOfficial,
  )?.name ??
  peak.alternativeNames.find((name) => name.languageCode === locale)?.name ??
  peak.name;
