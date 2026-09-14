import "server-only";
import { decodeAccessToken } from "./accessToken";
import { readAccessToken } from "./cookies";

export interface Session {
  userId: string;
  email: string;
  accessToken: string;
}

export const sessionFrom = (
  accessToken: string | undefined,
): Session | undefined => {
  if (!accessToken) {
    return undefined;
  }

  const claims = decodeAccessToken(accessToken);

  if (!claims) {
    return undefined;
  }

  if (claims.expiresAtMs !== undefined && claims.expiresAtMs <= Date.now()) {
    return undefined;
  }

  return { userId: claims.userId, email: claims.email, accessToken };
};

export const getSession = async (): Promise<Session | undefined> =>
  sessionFrom(await readAccessToken());
