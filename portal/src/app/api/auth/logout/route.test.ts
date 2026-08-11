import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readAccessToken = vi.fn();
const readRefreshToken = vi.fn();
const clearSessionCookies = vi.fn();

vi.mock("@/lib/auth/cookies", () => ({
  readAccessToken: () => readAccessToken(),
  readRefreshToken: () => readRefreshToken(),
  clearSessionCookies: () => clearSessionCookies(),
}));

vi.mock("@/lib/api/gateway", () => ({
  gatewayUrl: () => "http://gateway:8080",
  correlationHeader: "X-Correlation-Id",
}));

const { POST } = await import("./route");

const logoutRequest = (): NextRequest =>
  new NextRequest(
    new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { "Sec-Fetch-Site": "same-origin" },
    }),
  );

beforeEach(() => {
  readAccessToken.mockResolvedValue("at");
  readRefreshToken.mockResolvedValue("rt");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("POST /api/auth/logout", () => {
  it("logout_activeSession_sendsTheRefreshTokenReadFromTheCookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await POST(logoutRequest());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://gateway:8080/api/auth/logout");
    expect(init.body).toBe(JSON.stringify({ refreshToken: "rt" }));
  });

  it("logout_activeSession_clearsBothCookiesAndReturns204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    expect((await POST(logoutRequest())).status).toBe(204);
    expect(clearSessionCookies).toHaveBeenCalledOnce();
  });

  it("logout_withoutCookies_skipsTheGatewayButStillClears", async () => {
    readRefreshToken.mockResolvedValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await POST(logoutRequest())).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(clearSessionCookies).toHaveBeenCalledOnce();
  });
});
