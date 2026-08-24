import { NextResponse, type NextRequest } from "next/server";
import { crossSiteProblem, isSameOriginRequest } from "@/lib/api/csrf";
import { endpoints } from "@/lib/api/endpoints";
import { correlationHeader, gatewayUrl } from "@/lib/api/gateway";
import { clearSessionCookies, readAccessToken } from "@/lib/auth/cookies";

const revokeEverySession = async (correlationId: string): Promise<void> => {
  const accessToken = await readAccessToken();

  if (!accessToken) {
    return;
  }

  await fetch(`${gatewayUrl()}/api/${endpoints.auth.logoutAll}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      [correlationHeader]: correlationId,
    },
    cache: "no-store",
  });
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return crossSiteProblem();
  }

  await revokeEverySession(
    request.headers.get(correlationHeader) ?? crypto.randomUUID(),
  );
  await clearSessionCookies();

  return new NextResponse(null, { status: 204 });
}
