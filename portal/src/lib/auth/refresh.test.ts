import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readRefreshToken = vi.fn();
const writeSessionCookies = vi.fn();
const clearSessionCookies = vi.fn();

vi.mock("./cookies", () => ({
  readRefreshToken: () => readRefreshToken(),
  writeSessionCookies: (tokens: unknown) => writeSessionCookies(tokens),
  clearSessionCookies: () => clearSessionCookies(),
}));

vi.mock("@/lib/api/gateway", () => ({
  gatewayUrl: () => "http://gateway:8080",
  correlationHeader: "X-Correlation-Id",
}));

const tokens = {
  accessToken: "new-at",
  refreshToken: "new-rt",
  expiresInSeconds: 900,
  tokenType: "Bearer",
};

const importRefresh = async () => {
  vi.resetModules();
  return import("./refresh");
};

const deferredResponse = () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  return {
    release,
    respond: async () => {
      await gate;
      return { ok: true, json: async () => tokens } as Response;
    },
  };
};

beforeEach(() => {
  readRefreshToken.mockResolvedValue("current-rt");
  writeSessionCookies.mockResolvedValue(undefined);
  clearSessionCookies.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("refreshSession", () => {
  it("refreshSession_validRefreshToken_storesTheRotatedPair", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => tokens }),
    );
    const { refreshSession } = await importRefresh();

    await expect(refreshSession()).resolves.toEqual(tokens);
    expect(writeSessionCookies).toHaveBeenCalledWith(tokens);
    expect(clearSessionCookies).not.toHaveBeenCalled();
  });

  it("refreshSession_concurrentCallers_rotatesOnlyOnce", async () => {
    const gate = deferredResponse();
    const fetchMock = vi.fn().mockImplementation(gate.respond);
    vi.stubGlobal("fetch", fetchMock);
    const { refreshSession } = await importRefresh();

    const first = refreshSession();
    const second = refreshSession();
    gate.release();

    await expect(Promise.all([first, second])).resolves.toEqual([
      tokens,
      tokens,
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(writeSessionCookies).toHaveBeenCalledOnce();
  });

  it("refreshSession_afterCompletion_allowsANewRotation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => tokens });
    vi.stubGlobal("fetch", fetchMock);
    const { refreshSession } = await importRefresh();

    await refreshSession();
    await refreshSession();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refreshSession_rejectedByGateway_clearsTheSessionCookies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { refreshSession } = await importRefresh();

    await expect(refreshSession()).resolves.toBeUndefined();
    expect(clearSessionCookies).toHaveBeenCalledOnce();
    expect(writeSessionCookies).not.toHaveBeenCalled();
  });

  it("refreshSession_withoutRefreshCookie_doesNotCallTheGateway", async () => {
    readRefreshToken.mockResolvedValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { refreshSession } = await importRefresh();

    await expect(refreshSession()).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(clearSessionCookies).not.toHaveBeenCalled();
  });
});
