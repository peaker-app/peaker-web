import { NextResponse } from "next/server";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const sameOriginFetchSites = new Set(["same-origin", "none"]);

export const crossSiteProblem = (): NextResponse =>
  NextResponse.json(
    { status: 403, title: "Bff.CrossSiteRequest" },
    { status: 403 },
  );

const originMatches = (request: Request, origin: string): boolean => {
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
};

export const isSameOriginRequest = (request: Request): boolean => {
  if (safeMethods.has(request.method)) {
    return true;
  }

  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite) {
    return sameOriginFetchSites.has(fetchSite);
  }

  const origin = request.headers.get("origin");

  return origin === null ? false : originMatches(request, origin);
};
