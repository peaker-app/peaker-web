export const refreshTokenMaxAge = 60 * 60 * 24 * 30;

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
}

const secureCookies = (): boolean =>
  process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

export const sessionCookieOptions = (maxAge: number): SessionCookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: secureCookies(),
  path: "/",
  maxAge,
});
