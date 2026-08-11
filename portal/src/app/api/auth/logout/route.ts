import { NextResponse, type NextRequest } from "next/server";
import { crossSiteProblem, isSameOriginRequest } from "@/lib/api/csrf";
import { endpoints } from "@/lib/api/endpoints";
import { correlationHeader, gatewayUrl } from "@/lib/api/gateway";
import {
  clearSessionCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";

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
  if (!isSameOriginRequest(request)) {
    return crossSiteProblem();
  }

  await revokeRefreshToken(
    request.headers.get(correlationHeader) ?? crypto.randomUUID(),
  );
  await clearSessionCookies();

  return new NextResponse(null, { status: 204 });
}
