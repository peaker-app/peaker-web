import { NextResponse, type NextRequest } from "next/server";
import { readProblem } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { correlationHeader, gatewayUrl } from "@/lib/api/gateway";
import { writeSessionCookies } from "@/lib/auth/cookies";
import type { AuthTokensResponse, LoginRequest } from "@/types/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const credentials = (await request.json()) as LoginRequest;

  const upstream = await fetch(
    `${gatewayUrl()}/api/${endpoints.auth.login}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [correlationHeader]:
          request.headers.get(correlationHeader) ?? crypto.randomUUID(),
      },
      body: JSON.stringify(credentials),
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const problem = await readProblem(upstream);

    return NextResponse.json(problem, { status: problem.status });
  }

  await writeSessionCookies((await upstream.json()) as AuthTokensResponse);

  return new NextResponse(null, { status: 204 });
}
