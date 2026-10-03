import { endpoints } from "@/lib/api/endpoints";
import { gatewayUrl } from "@/lib/api/gateway";
import type { AuthTokensResponse } from "@/types/api";

export type RotationOutcome =
  | { status: "rotated"; tokens: AuthTokensResponse }
  | { status: "rejected" }
  | { status: "unreachable" };

const rotationTimeoutMs = 5_000;
const rejectedStatuses = new Set([401, 403]);
const inFlight = new Map<string, Promise<RotationOutcome>>();

const callRefresh = async (refreshToken: string): Promise<RotationOutcome> => {
  let response: Response;

  try {
    response = await fetch(`${gatewayUrl()}/api/${endpoints.auth.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(rotationTimeoutMs),
    });
  } catch {
    return { status: "unreachable" };
  }

  if (response.ok) {
    return {
      status: "rotated",
      tokens: (await response.json()) as AuthTokensResponse,
    };
  }

  return rejectedStatuses.has(response.status)
    ? { status: "rejected" }
    : { status: "unreachable" };
};

export const rotateTokens = (
  refreshToken: string,
): Promise<RotationOutcome> => {
  const pending = inFlight.get(refreshToken);

  if (pending) {
    return pending;
  }

  const rotation = callRefresh(refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, rotation);

  return rotation;
};
