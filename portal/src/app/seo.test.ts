import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import robots from "./robots";
import sitemap from "./sitemap";

const original = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://peaker.app";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("robots", () => {
  it("robots_publicCatalogue_isAllowed", () => {
    expect(robots().rules).toMatchObject([{ userAgent: "*", allow: "/" }]);
  });

  it("robots_privateAndTransportRoutes_areDisallowed", () => {
    const [rule] = [robots().rules].flat();

    expect(rule?.disallow).toEqual(
      expect.arrayContaining(["/api/", "/*/dashboard", "/*/login"]),
    );
  });

  it("robots_sitemap_pointsToTheSiteUrl", () => {
    expect(robots().sitemap).toBe("https://peaker.app/sitemap.xml");
  });
});

describe("sitemap", () => {
  it("sitemap_publicPaths_haveOneEntryPerLocale", () => {
    expect(sitemap()).toHaveLength(2 * locales.length);
  });

  it("sitemap_everyEntry_carriesItsHreflangAlternates", () => {
    for (const entry of sitemap()) {
      expect(Object.keys(entry.alternates?.languages ?? {})).toHaveLength(
        locales.length + 1,
      );
    }
  });

  it("sitemap_landing_usesTheLocalePrefixWithoutTrailingSlash", () => {
    expect(sitemap().map((entry) => entry.url)).toContain(
      "https://peaker.app/en",
    );
  });

  it("sitemap_catalogue_isIncludedForEveryLocale", () => {
    const urls = sitemap().map((entry) => entry.url);

    for (const locale of locales) {
      expect(urls).toContain(`https://peaker.app/${locale}/peaks`);
    }
  });
});
