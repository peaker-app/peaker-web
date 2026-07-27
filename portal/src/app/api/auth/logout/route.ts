import { NextResponse, type NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { correlationHeader, gatewayUrl } from "@/lib/api/gateway";
import {
  clearSessionCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";

// Motivo: el navegador no tiene el refresh token; lo aporta este handler desde la cookie.
const revokeRefreshToken = async (
  correlationId: string,
): Promise<void> => {
  const [accessToken, refreshToken] = await Promise.all([
    readAccessToken(),
    readRefreshToken(),
  ]);

  if (!accessToken || !refreshToken) {
    return;
  }

  await fetch(`${gatewayUrl()}/api/${endpoints.auth.logout}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      [correlationHeader]: correlationId,
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  await revokeRefreshToken(
    request.headers.get(correlationHeader) ?? crypto.randomUUID(),
  );
  await clearSessionCookies();

  return new NextResponse(null, { status: 204 });
}
