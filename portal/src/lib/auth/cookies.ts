import "server-only";
import { cookies } from "next/headers";
import type { AuthTokensResponse } from "@/types/api";
import {
  accessTokenCookieName,
  refreshTokenCookieName,
  refreshTokenCookiePath,
} from "./cookieNames";

const refreshTokenMaxAge = 60 * 60 * 24 * 30;

const baseOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

export const readAccessToken = async (): Promise<string | undefined> =>
  (await cookies()).get(accessTokenCookieName)?.value;

export const readRefreshToken = async (): Promise<string | undefined> =>
  (await cookies()).get(refreshTokenCookieName)?.value;

export const writeSessionCookies = async (
  tokens: AuthTokensResponse,
): Promise<void> => {
  const store = await cookies();

  store.set(accessTokenCookieName, tokens.accessToken, {
    ...baseOptions,
    path: "/",
    maxAge: tokens.expiresInSeconds,
  });

  store.set(refreshTokenCookieName, tokens.refreshToken, {
    ...baseOptions,
    path: refreshTokenCookiePath,
    maxAge: refreshTokenMaxAge,
  });
};

export const clearSessionCookies = async (): Promise<void> => {
  const store = await cookies();

  store.set(accessTokenCookieName, "", {
    ...baseOptions,
    path: "/",
    maxAge: 0,
  });

  store.set(refreshTokenCookieName, "", {
    ...baseOptions,
    path: refreshTokenCookiePath,
    maxAge: 0,
  });
};
