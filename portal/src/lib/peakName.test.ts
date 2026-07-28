import { describe, expect, it } from "vitest";
import { localizedPeakName } from "./peakName";

const matterhorn = {
  name: "Matterhorn",
  alternativeNames: [
    { languageCode: "it", name: "Cervino", isOfficial: true },
    { languageCode: "es", name: "Cervino", isOfficial: false },
    { languageCode: "fr", name: "Mont Cervin", isOfficial: true },
    { languageCode: "fr", name: "Le Cervin", isOfficial: false },
  ],
};

describe("localizedPeakName", () => {
  it("localizedPeakName_officialLabelForLocale_winsOverAlias", () => {
    expect(localizedPeakName(matterhorn, "fr")).toBe("Mont Cervin");
  });

  it("localizedPeakName_onlyAliasForLocale_usesTheAlias", () => {
    expect(localizedPeakName(matterhorn, "es")).toBe("Cervino");
  });

  it.each(["zh", "ar"] as const)(
    "localizedPeakName_%sWithoutIngestedNames_fallsBackToTheCanonical",
    (locale) => {
      expect(localizedPeakName(matterhorn, locale)).toBe("Matterhorn");
    },
  );

  it("localizedPeakName_noAlternativeNames_returnsTheCanonical", () => {
    expect(
      localizedPeakName({ name: "Aneto", alternativeNames: [] }, "es"),
    ).toBe("Aneto");
  });

  it("localizedPeakName_english_returnsTheCanonical", () => {
    expect(localizedPeakName(matterhorn, "en")).toBe("Matterhorn");
  });
});
