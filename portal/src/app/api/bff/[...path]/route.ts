import { NextResponse, type NextRequest } from "next/server";
import { crossSiteProblem, isSameOriginRequest } from "@/lib/api/csrf";
import { isAllowedGatewayPath } from "@/lib/api/endpoints";
import { clientForwardedFor, forwardedForHeader } from "@/lib/api/forwarded";
import { correlationHeader, gatewayUrl } from "@/lib/api/gateway";
import { readAccessToken } from "@/lib/auth/cookies";
import { ensureSession, refreshSession } from "@/lib/auth/refresh";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

type StreamingRequestInit = RequestInit & { duplex?: "half" };

const strippedHeaders = new Set([
  "connection",
  "content-length",
  "cookie",
  "host",
  "origin",
  "referer",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "transfer-encoding",
]);

const forwardedHeaders = async (
  request: NextRequest,
  correlationId: string,
): Promise<Headers> => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!strippedHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.delete("authorization");
  headers.set(correlationHeader, correlationId);

  const forwardedFor = clientForwardedFor(request.headers);

  if (forwardedFor) {
    headers.set(forwardedForHeader, forwardedFor);
  }

  const token = await readAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
};

const callGateway = async (
  target: string,
  source: NextRequest,
  correlationId: string,
): Promise<Response> => {
  const hasBody = source.method !== "GET" && source.method !== "HEAD";
  const init: StreamingRequestInit = {
    method: source.method,
    headers: await forwardedHeaders(source, correlationId),
    cache: "no-store",
    redirect: "manual",
  };

  if (hasBody && source.body) {
    init.body = source.body;
    init.duplex = "half";
  }

  return fetch(target, init);
};

const respond = (upstream: Response): NextResponse => {
  const headers = new Headers(upstream.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};

const notProxied = (): NextResponse =>
  NextResponse.json(
    { status: 404, title: "Bff.PathNotAllowed" },
    { status: 404 },
  );

const proxyToGateway = async (
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> => {
  if (!isSameOriginRequest(request)) {
    return crossSiteProblem();
  }

  const { path } = await context.params;

  if (!isAllowedGatewayPath(path)) {
    return notProxied();
  }

  const target = `${gatewayUrl()}/api/${path.join("/")}${request.nextUrl.search}`;
  const correlationId =
    request.headers.get(correlationHeader) ?? crypto.randomUUID();
  const replay = request.clone() as NextRequest;

  await ensureSession();

  const first = await callGateway(target, request, correlationId);

  if (first.status !== 401 || (await refreshSession()).status !== "rotated") {
    return respond(first);
  }

  return respond(await callGateway(target, replay, correlationId));
};

export const GET = proxyToGateway;
export const POST = proxyToGateway;
export const PUT = proxyToGateway;
export const DELETE = proxyToGateway;
export const PATCH = proxyToGateway;
