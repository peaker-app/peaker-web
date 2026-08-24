import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const intlHandled = vi.fn();

vi.mock("next-intl/middleware", () => ({
  default: () => () => {
    intlHandled();
    return NextResponse.next();
  },
}));

const { config, proxy } = await import("./proxy");

interface RequestOptions {
  cookies?: Record<string, string>;
  acceptLanguage?: string;
}

const encode = (payload: Record<string, unknown>): string =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

const usableToken = (): string =>
  encode({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 900 });

const expiredToken = (): string =>
  encode({ sub: "u1", exp: Math.floor(Date.now() / 1000) - 1 });

const request = (path: string, options: RequestOptions = {}): NextRequest => {
  const headers = new Headers();

  if (options.acceptLanguage) {
    headers.set("accept-language", options.acceptLanguage);
  }

  const cookiePairs = Object.entries(options.cookies ?? {});

  if (cookiePairs.length > 0) {
    headers.set(
      "cookie",
      cookiePairs.map(([name, value]) => `${name}=${value}`).join("; "),
    );
  }

  return new NextRequest(new Request(`http://localhost:3000${path}`, { headers }));
};

const location = (response: NextResponse): URL =>
  new URL(response.headers.get("location") ?? "", "http://localhost:3000");

afterEach(() => {
  vi.clearAllMocks();
});

describe("rutas sin prefijo de locale", () => {
  it("proxy_confirmEmailWithoutLocale_redirectsWith308", () => {
    const response = proxy(request("/confirm-email?token=abc123"));

    expect(response.status).toBe(308);
  });

  it("proxy_confirmEmailWithoutLocale_preservesTheOneShotToken", () => {
    const response = proxy(request("/confirm-email?token=abc123"));

    expect(location(response).search).toBe("?token=abc123");
  });

  it("proxy_confirmEmailWithLocaleCookie_usesTheStoredLocale", () => {
    const response = proxy(
      request("/confirm-email?token=t", { cookies: { NEXT_LOCALE: "fr" } }),
    );

    expect(location(response).pathname).toBe("/fr/confirm-email");
  });

  it("proxy_confirmEmailWithAcceptLanguage_negotiatesByQuality", () => {
    const response = proxy(
      request("/confirm-email?token=t", {
        acceptLanguage: "de;q=0.9, ar;q=0.95, en;q=0.5",
      }),
    );

    expect(location(response).pathname).toBe("/ar/confirm-email");
  });

  it("proxy_confirmEmailWithUnsupportedLanguages_fallsBackToDefault", () => {
    const response = proxy(
      request("/confirm-email?token=t", { acceptLanguage: "de-DE, pt;q=0.8" }),
    );

    expect(location(response).pathname).toBe("/en/confirm-email");
  });

  it("proxy_confirmEmailWithRegionalTag_matchesTheBaseLanguage", () => {
    const response = proxy(
      request("/confirm-email?token=t", { acceptLanguage: "es-AR,es;q=0.9" }),
    );

    expect(location(response).pathname).toBe("/es/confirm-email");
  });

  it("proxy_invalidLocaleCookie_isIgnored", () => {
    const response = proxy(
      request("/confirm-email?token=t", { cookies: { NEXT_LOCALE: "de" } }),
    );

    expect(location(response).pathname).toBe("/en/confirm-email");
  });

  it("proxy_confirmEmailAlreadyPrefixed_isNotRedirectedAgain", () => {
    proxy(request("/es/confirm-email?token=t"));

    expect(intlHandled).toHaveBeenCalledOnce();
  });
});

describe("guard de rutas privadas", () => {
  it("proxy_dashboardWithoutSession_redirectsToLogin", () => {
    const response = proxy(request("/en/dashboard"));

    expect(location(response).pathname).toBe("/en/login");
  });

  it("proxy_dashboardWithoutSession_carriesTheOriginalDestination", () => {
    const response = proxy(request("/es/dashboard/ascents/new?peakId=p1"));

    expect(location(response).searchParams.get("next")).toBe(
      "/es/dashboard/ascents/new?peakId=p1",
    );
  });

  it("proxy_dashboardWithUsableToken_isLetThrough", () => {
    proxy(request("/en/dashboard", { cookies: { peaker_at: usableToken() } }));

    expect(intlHandled).toHaveBeenCalledOnce();
  });

  it("proxy_dashboardWithExpiredToken_redirectsToLoginAnyway", () => {
    const response = proxy(
      request("/en/dashboard", { cookies: { peaker_at: expiredToken() } }),
    );

    expect(location(response).pathname).toBe("/en/login");
  });

  it("proxy_publicRouteWithoutSession_isLetThrough", () => {
    proxy(request("/en/peaks"));

    expect(intlHandled).toHaveBeenCalledOnce();
  });

  it("proxy_routeNamedLikeTheDashboard_isNotConfusedWithIt", () => {
    proxy(request("/en/dashboards"));

    expect(intlHandled).toHaveBeenCalledOnce();
  });
});

describe("matcher", () => {
  it("config_matcher_excludesApiRoutesAndStaticAssets", () => {
    expect(config.matcher).toEqual(["/((?!api|_next|_vercel|.*\\..*).*)"]);
  });
});
