import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clampRadius,
  defaultAttribution,
  defaultProviderName,
  defaultTileUrl,
  isLatitude,
  isLongitude,
  isRadius,
  mapProviderName,
  mapsEnabled,
  maxRadiusMeters,
  minRadiusMeters,
  tileAttribution,
  tileUrl,
} from "./map";

const originalUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL;
const originalAttribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION;
const originalProviderName = process.env.NEXT_PUBLIC_MAP_PROVIDER_NAME;
const originalEnabled = process.env.NEXT_PUBLIC_MAP_ENABLED;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_MAP_TILE_URL;
  delete process.env.NEXT_PUBLIC_MAP_ATTRIBUTION;
  delete process.env.NEXT_PUBLIC_MAP_PROVIDER_NAME;
  delete process.env.NEXT_PUBLIC_MAP_ENABLED;
});

afterEach(() => {
  process.env.NEXT_PUBLIC_MAP_TILE_URL = originalUrl;
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION = originalAttribution;
  process.env.NEXT_PUBLIC_MAP_PROVIDER_NAME = originalProviderName;
  process.env.NEXT_PUBLIC_MAP_ENABLED = originalEnabled;
});

describe("tileUrl", () => {
  it("tileUrl_withoutConfiguration_fallsBackToOpenStreetMap", () => {
    expect(tileUrl()).toBe(defaultTileUrl);
  });

  it("tileUrl_configuredProvider_isUsed", () => {
    process.env.NEXT_PUBLIC_MAP_TILE_URL = "https://tiles.example/{z}/{x}/{y}.png";

    expect(tileUrl()).toBe("https://tiles.example/{z}/{x}/{y}.png");
  });

  it("tileUrl_emptyVariable_fallsBackToOpenStreetMap", () => {
    process.env.NEXT_PUBLIC_MAP_TILE_URL = "";

    expect(tileUrl()).toBe(defaultTileUrl);
  });

  it("tileAttribution_withoutConfiguration_creditsOpenStreetMap", () => {
    expect(tileAttribution()).toBe(defaultAttribution);
  });

  it("tileAttribution_emptyVariable_creditsOpenStreetMap", () => {
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION = "";

    expect(tileAttribution()).toBe(defaultAttribution);
  });
});

describe("mapProviderName", () => {
  it("mapProviderName_withoutConfiguration_isOpenStreetMap", () => {
    expect(mapProviderName()).toBe(defaultProviderName);
  });

  it("mapProviderName_configuredProvider_isUsed", () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER_NAME = "MapTiler";

    expect(mapProviderName()).toBe("MapTiler");
  });

  it("mapProviderName_emptyVariable_isOpenStreetMap", () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER_NAME = "";

    expect(mapProviderName()).toBe(defaultProviderName);
  });
});

describe("mapsEnabled", () => {
  it("mapsEnabled_withoutConfiguration_isEnabled", () => {
    expect(mapsEnabled()).toBe(true);
  });

  it("mapsEnabled_false_isDisabled", () => {
    process.env.NEXT_PUBLIC_MAP_ENABLED = "false";

    expect(mapsEnabled()).toBe(false);
  });

  it("mapsEnabled_anyOtherValue_isEnabled", () => {
    process.env.NEXT_PUBLIC_MAP_ENABLED = "true";

    expect(mapsEnabled()).toBe(true);
  });
});

describe("isLatitude", () => {
  it.each([-90, 0, 45.8326, 90])("isLatitude_%s_isValid", (value) => {
    expect(isLatitude(value)).toBe(true);
  });

  it.each([-90.1, 90.1, Number.NaN, Number.POSITIVE_INFINITY])(
    "isLatitude_%s_isRejected",
    (value) => {
      expect(isLatitude(value)).toBe(false);
    },
  );
});

describe("isLongitude", () => {
  it.each([-180, 0, 6.8652, 180])("isLongitude_%s_isValid", (value) => {
    expect(isLongitude(value)).toBe(true);
  });

  it.each([-180.1, 180.1, Number.NaN])("isLongitude_%s_isRejected", (value) => {
    expect(isLongitude(value)).toBe(false);
  });
});

describe("isRadius", () => {
  it.each([1, 25_000, maxRadiusMeters])("isRadius_%s_isValid", (value) => {
    expect(isRadius(value)).toBe(true);
  });

  it.each([0, -1, maxRadiusMeters + 1, Number.NaN])(
    "isRadius_%s_isRejected",
    (value) => {
      expect(isRadius(value)).toBe(false);
    },
  );
});

describe("clampRadius", () => {
  it("clampRadius_belowTheMinimum_isRaised", () => {
    expect(clampRadius(10)).toBe(minRadiusMeters);
  });

  it("clampRadius_aboveTheMaximum_isCapped", () => {
    expect(clampRadius(500_000)).toBe(maxRadiusMeters);
  });

  it("clampRadius_withinRange_isUnchanged", () => {
    expect(clampRadius(25_000)).toBe(25_000);
  });
});
