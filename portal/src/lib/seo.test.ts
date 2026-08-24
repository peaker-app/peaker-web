import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { alternatesFor, languageAlternates, noIndex, siteUrl } from "./seo";

const original = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://peaker.app";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("siteUrl", () => {
  it("siteUrl_trailingSlash_isStripped", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://peaker.app/";

    expect(siteUrl()).toBe("https://peaker.app");
  });

  it("siteUrl_missingVariable_fallsBackToLocalhost", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("siteUrl_emptyVariable_fallsBackToLocalhost", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";

    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("languageAlternates", () => {
  it("languageAlternates_anyPath_emitsOneEntryPerLocalePlusXDefault", () => {
    const alternates = languageAlternates("/peaks");

    expect(Object.keys(alternates)).toHaveLength(locales.length + 1);
    for (const locale of locales) {
      expect(alternates[locale]).toBe(`https://peaker.app/${locale}/peaks`);
    }
  });

  it("languageAlternates_xDefault_pointsToEnglish", () => {
    expect(languageAlternates("/peaks")["x-default"]).toBe(
      "https://peaker.app/en/peaks",
    );
  });

  it("languageAlternates_rootPath_doesNotDuplicateTheSlash", () => {
    expect(languageAlternates("/").en).toBe("https://peaker.app/en");
  });
});

describe("alternatesFor", () => {
  it("alternatesFor_locale_setsTheCanonicalOfThatLocale", () => {
    expect(alternatesFor("ar", "/peaks").canonical).toBe(
      "https://peaker.app/ar/peaks",
    );
  });

  it("alternatesFor_locale_alsoCarriesEveryHreflang", () => {
    expect(
      Object.keys(alternatesFor("es", "/peaks").languages ?? {}),
    ).toHaveLength(locales.length + 1);
  });
});

describe("noIndex", () => {
  it("noIndex_privateScreens_blocksIndexingAndFollowing", () => {
    expect(noIndex()).toEqual({ index: false, follow: false });
  });
});
