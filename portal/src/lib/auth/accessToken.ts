export interface AccessTokenClaims {
  userId: string;
  email: string;
  expiresAtMs: number | undefined;
}

interface RawClaims {
  sub?: string;
  email?: string;
  exp?: number;
}

// Motivo: el gateway es quien valida la firma. Aquí solo se leen sub, email y exp
// para decidir navegación y pintar la interfaz, nunca para autorizar.
const parsePayload = (token: string): RawClaims | undefined => {
  const payload = token.split(".")[1];

  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as RawClaims;
  } catch {
    return undefined;
  }
};

export const decodeAccessToken = (
  token: string,
): AccessTokenClaims | undefined => {
  const claims = parsePayload(token);

  if (!claims?.sub) {
    return undefined;
  }

  return {
    userId: claims.sub,
    email: claims.email ?? "",
    expiresAtMs: claims.exp === undefined ? undefined : claims.exp * 1000,
  };
};

export const isAccessTokenUsable = (token: string | undefined): boolean => {
  if (!token) {
    return false;
  }

  const claims = decodeAccessToken(token);

  return (
    claims !== undefined &&
    (claims.expiresAtMs === undefined || claims.expiresAtMs > Date.now())
  );
};
