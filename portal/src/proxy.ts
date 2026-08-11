import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { isAccessTokenUsable } from "@/lib/auth/accessToken";
import { accessTokenCookieName } from "@/lib/auth/cookieNames";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);

const localeCookieName = "NEXT_LOCALE";
const unprefixedRoutes = ["/confirm-email", "/reset-password"];
const permanentRedirect = 308;

const parseAcceptLanguage = (header: string | null): Locale | undefined => {
  if (!header) {
    return undefined;
  }

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", quality] = part.trim().split(";q=");
      return { tag: tag.split("-")[0] ?? "", weight: Number(quality ?? 1) };
    })
    .sort((a, b) => b.weight - a.weight);

  return ranked.map(({ tag }) => tag).find(isLocale);
};

const resolveLocale = (request: NextRequest): Locale => {
  const fromCookie = request.cookies.get(localeCookieName)?.value;

  if (fromCookie && isLocale(fromCookie)) {
    return fromCookie;
  }

  return (
    parseAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale
  );
};

const hasLocalePrefix = (pathname: string): boolean =>
  locales.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

const redirectUnprefixedRoute = (request: NextRequest): NextResponse => {
  const target = request.nextUrl.clone();
  target.pathname = `/${resolveLocale(request)}${request.nextUrl.pathname}`;

  return NextResponse.redirect(target, permanentRedirect);
};

const isProtectedRoute = (pathname: string): boolean =>
  /^\/[^/]+\/dashboard(\/|$)/.test(pathname);

const redirectToLogin = (request: NextRequest): NextResponse => {
  const [, locale] = request.nextUrl.pathname.split("/");
  const target = request.nextUrl.clone();
  target.pathname = `/${locale}/login`;
  target.search = "";
  target.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(target);
};

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!hasLocalePrefix(pathname) && unprefixedRoutes.includes(pathname)) {
    return redirectUnprefixedRoute(request);
  }

  const accessToken = request.cookies.get(accessTokenCookieName)?.value;

  if (isProtectedRoute(pathname) && !isAccessTokenUsable(accessToken)) {
    return redirectToLogin(request);
  }

  return intlProxy(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
