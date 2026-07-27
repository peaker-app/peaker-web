import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

export const siteUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

const absolute = (locale: Locale, path: string): string =>
  `${siteUrl()}/${locale}${path === "/" ? "" : path}`;

export const languageAlternates = (
  path: string,
): Record<string, string> => {
  const alternates: Record<string, string> = {};

  for (const locale of locales) {
    alternates[locale] = absolute(locale, path);
  }

  alternates["x-default"] = absolute(defaultLocale, path);

  return alternates;
};

export const alternatesFor = (
  locale: Locale,
  path: string,
): NonNullable<Metadata["alternates"]> => ({
  canonical: absolute(locale, path),
  languages: languageAlternates(path),
});

export const noIndex = (): NonNullable<Metadata["robots"]> => ({
  index: false,
  follow: false,
});
