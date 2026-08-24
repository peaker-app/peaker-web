import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readAccessToken = vi.fn();
const clearSessionCookies = vi.fn();

vi.mock("@/lib/auth/cookies", () => ({
  readAccessToken: () => readAccessToken(),
  clearSessionCookies: () => clearSessionCookies(),
}));

vi.mock("@/lib/api/gateway", () => ({
  gatewayUrl: () => "http://gateway:8080",
  correlationHeader: "X-Correlation-Id",
}));

const { POST } = await import("./route");

const logoutAllRequest = (site = "same-origin"): NextRequest =>
  new NextRequest(
    new Request("http://localhost:3000/api/auth/logout/all", {
      method: "POST",
      headers: { "Sec-Fetch-Site": site },
    }),
  );

beforeEach(() => {
  readAccessToken.mockResolvedValue("at");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("POST /api/auth/logout/all", () => {
  it("logoutAll_activeSession_callsTheGatewayWithTheAccessToken", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await POST(logoutAllRequest());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://gateway:8080/api/auth/logout/all");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer at",
    );
  });

  it("logoutAll_activeSession_clearsBothCookiesAndReturns204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    expect((await POST(logoutAllRequest())).status).toBe(204);
    expect(clearSessionCookies).toHaveBeenCalledOnce();
  });

  it("logoutAll_withoutCookies_skipsTheGatewayButStillClears", async () => {
    readAccessToken.mockResolvedValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await POST(logoutAllRequest())).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(clearSessionCookies).toHaveBeenCalledOnce();
  });

  it("logoutAll_crossSiteRequest_isRefusedWithoutTouchingTheSession", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await POST(logoutAllRequest("cross-site"))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(clearSessionCookies).not.toHaveBeenCalled();
  });
});
