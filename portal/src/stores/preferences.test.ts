import { beforeEach, describe, expect, it } from "vitest";
import { usePreferences } from "./preferences";

beforeEach(() => {
  usePreferences.setState({ ascentListView: "cards" });
});

describe("usePreferences", () => {
  it("usePreferences_defaults_useMetricUnits", () => {
    expect(usePreferences.getState().unitSystem).toBe("metric");
  });

  it("usePreferences_defaults_showAscentsAsCards", () => {
    expect(usePreferences.getState().ascentListView).toBe("cards");
  });

  it("usePreferences_setAscentListView_persistsTheChoice", () => {
    usePreferences.getState().setAscentListView("table");

    expect(usePreferences.getState().ascentListView).toBe("table");
  });
});
