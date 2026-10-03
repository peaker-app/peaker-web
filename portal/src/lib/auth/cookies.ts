import "server-only";
import { cookies } from "next/headers";
import type { AuthTokensResponse } from "@/types/api";
import { accessTokenCookieName, refreshTokenCookieName } from "./cookieNames";
import { refreshTokenMaxAge, sessionCookieOptions } from "./cookieOptions";

export const readAccessToken = async (): Promise<string | undefined> =>
  (await cookies()).get(accessTokenCookieName)?.value;

export const readRefreshToken = async (): Promise<string | undefined> =>
  (await cookies()).get(refreshTokenCookieName)?.value;

export const writeSessionCookies = async (
  tokens: AuthTokensResponse,
): Promise<void> => {
  const store = await cookies();

  store.set(
    accessTokenCookieName,
    tokens.accessToken,
    sessionCookieOptions(tokens.expiresInSeconds),
  );

  store.set(
    refreshTokenCookieName,
    tokens.refreshToken,
    sessionCookieOptions(refreshTokenMaxAge),
  );
};

export const clearSessionCookies = async (): Promise<void> => {
  const store = await cookies();

  store.set(accessTokenCookieName, "", sessionCookieOptions(0));
  store.set(refreshTokenCookieName, "", sessionCookieOptions(0));
};
