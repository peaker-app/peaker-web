import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "./csrf";

const url = "http://localhost:3000/api/bff/ascents/1";

const build = (init: RequestInit): Request => new Request(url, init);

describe("isSameOriginRequest", () => {
  it.each(["GET", "HEAD", "OPTIONS"])(
    "csrf_%sIsSafe_isAlwaysAllowed",
    (method) => {
      expect(isSameOriginRequest(build({ method }))).toBe(true);
    },
  );

  it.each(["same-origin", "none"])(
    "csrf_secFetchSite_%s_isAllowed",
    (fetchSite) => {
      const request = build({
        method: "DELETE",
        headers: { "Sec-Fetch-Site": fetchSite },
      });

      expect(isSameOriginRequest(request)).toBe(true);
    },
  );

  it.each(["cross-site", "same-site"])(
    "csrf_secFetchSite_%s_isRejected",
    (fetchSite) => {
      const request = build({
        method: "DELETE",
        headers: { "Sec-Fetch-Site": fetchSite },
      });

      expect(isSameOriginRequest(request)).toBe(false);
    },
  );

  it("csrf_secFetchSiteWins_evenWithAMatchingOrigin", () => {
    const request = build({
      method: "POST",
      headers: {
        "Sec-Fetch-Site": "cross-site",
        Origin: "http://localhost:3000",
      },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("csrf_withoutSecFetchSite_fallsBackToAMatchingOrigin", () => {
    const request = build({
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("csrf_withoutSecFetchSite_rejectsAForeignOrigin", () => {
    const request = build({
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("csrf_withoutSecFetchSite_rejectsAMalformedOrigin", () => {
    const request = build({
      method: "POST",
      headers: { Origin: "null" },
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("csrf_unsafeMethodWithNoHeadersAtAll_isRejected", () => {
    expect(isSameOriginRequest(build({ method: "DELETE" }))).toBe(false);
  });
});
