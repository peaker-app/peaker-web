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

const accessOptions = { ...baseOptions, path: "/" } as const;

const refreshOptions = {
  ...baseOptions,
  sameSite: "strict",
  path: refreshTokenCookiePath,
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
    ...accessOptions,
    maxAge: tokens.expiresInSeconds,
  });

  store.set(refreshTokenCookieName, tokens.refreshToken, {
    ...refreshOptions,
    maxAge: refreshTokenMaxAge,
  });
};

export const clearSessionCookies = async (): Promise<void> => {
  const store = await cookies();

  store.set(accessTokenCookieName, "", { ...accessOptions, maxAge: 0 });
  store.set(refreshTokenCookieName, "", { ...refreshOptions, maxAge: 0 });
};
