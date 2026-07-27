import "server-only";
import { decodeAccessToken } from "./accessToken";
import { readAccessToken } from "./cookies";

export interface Session {
  userId: string;
  email: string;
  accessToken: string;
}

export const getSession = async (): Promise<Session | undefined> => {
  const accessToken = await readAccessToken();

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
