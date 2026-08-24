import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const writeSessionCookies = vi.fn();

vi.mock("@/lib/auth/cookies", () => ({
  writeSessionCookies: (tokens: unknown) => writeSessionCookies(tokens),
}));

vi.mock("@/lib/api/gateway", () => ({
  gatewayUrl: () => "http://gateway:8080",
  correlationHeader: "X-Correlation-Id",
}));

const { POST } = await import("./route");

const tokens = {
  accessToken: "at",
  refreshToken: "rt",
  expiresInSeconds: 900,
  tokenType: "Bearer",
};

const loginRequest = (): NextRequest =>
  new NextRequest(
    new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ identifier: "ruben", password: "secret1234" }),
    }),
  );

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("login_validCredentials_storesCookiesAndReturns204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => tokens }),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(204);
    expect(writeSessionCookies).toHaveBeenCalledWith(tokens);
  });

  it("login_validCredentials_neverLeaksTheTokensToTheBrowser", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => tokens }),
    );

    const body = await (await POST(loginRequest())).text();

    expect(body).toBe("");
  });

  it("login_invalidCredentials_forwardsTheProblemWithItsStatus", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ title: "User.InvalidCredentials" }),
      }),
    );

    const response = await POST(loginRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      title: "User.InvalidCredentials",
    });
    expect(writeSessionCookies).not.toHaveBeenCalled();
  });

  it("login_rateLimited_forwards429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => {
          throw new Error("no body");
        },
      }),
    );

    expect((await POST(loginRequest())).status).toBe(429);
  });

  it("login_anyCall_targetsTheGatewayLoginRoute", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => tokens });
    vi.stubGlobal("fetch", fetchMock);

    await POST(loginRequest());

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://gateway:8080/api/auth/login",
    );
  });
});
