import "server-only";
import {
  clearSessionCookies,
  readAccessToken,
  readRefreshToken,
  writeSessionCookies,
} from "./cookies";
import { rotateTokens, type RotationOutcome } from "./rotate";
import { sessionFrom, type Session } from "./session";

export const refreshSession = async (): Promise<RotationOutcome> => {
  const refreshToken = await readRefreshToken();

  if (!refreshToken) {
    return { status: "rejected" };
  }

  const outcome = await rotateTokens(refreshToken);

  if (outcome.status === "rotated") {
    await writeSessionCookies(outcome.tokens);
  }

  if (outcome.status === "rejected") {
    await clearSessionCookies();
  }

  return outcome;
};

export const ensureSession = async (): Promise<Session | undefined> => {
  const current = sessionFrom(await readAccessToken());

  if (current) {
    return current;
  }

  const outcome = await refreshSession();

  return outcome.status === "rotated"
    ? sessionFrom(outcome.tokens.accessToken)
    : undefined;
};
