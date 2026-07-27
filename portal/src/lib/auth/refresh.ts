import "server-only";
import { endpoints } from "@/lib/api/endpoints";
import { gatewayUrl } from "@/lib/api/gateway";
import type { AuthTokensResponse } from "@/types/api";
import {
  clearSessionCookies,
  readRefreshToken,
  writeSessionCookies,
} from "./cookies";

// Motivo: el refresh rota y revoca el token usado (RF-AUT-04). Dos rotaciones
// simultáneas revocarían la cadena entera, así que solo puede haber una en vuelo.
let inFlight: Promise<AuthTokensResponse | undefined> | undefined;

const requestNewTokens = async (
  refreshToken: string,
): Promise<AuthTokensResponse | undefined> => {
  const response = await fetch(`${gatewayUrl()}/api/${endpoints.auth.refresh}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  return response.ok
    ? ((await response.json()) as AuthTokensResponse)
    : undefined;
};

const rotate = async (): Promise<AuthTokensResponse | undefined> => {
  const refreshToken = await readRefreshToken();

  if (!refreshToken) {
    return undefined;
  }

  const tokens = await requestNewTokens(refreshToken);

  if (!tokens) {
    await clearSessionCookies();
    return undefined;
  }

  await writeSessionCookies(tokens);

  return tokens;
};

export const refreshSession = (): Promise<AuthTokensResponse | undefined> => {
  inFlight ??= rotate().finally(() => {
    inFlight = undefined;
  });

  return inFlight;
};
