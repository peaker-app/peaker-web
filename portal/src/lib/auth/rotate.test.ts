import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/gateway", () => ({
  gatewayUrl: () => "http://gateway:8080",
  correlationHeader: "X-Correlation-Id",
}));

const tokensFor = (refreshToken: string) => ({
  accessToken: `at-for-${refreshToken}`,
  refreshToken: `rotated-${refreshToken}`,
  expiresInSeconds: 900,
  tokenType: "Bearer",
});

const importRotate = async () => {
  vi.resetModules();
  return import("./rotate");
};

const okResponse = (refreshToken: string) =>
  ({ ok: true, json: async () => tokensFor(refreshToken) }) as Response;

const errorResponse = (status: number) =>
  ({ ok: false, status }) as Response;

const deferred = () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { release, gate };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("rotateTokens", () => {
  it("rotateTokens_validToken_returnsTheRotatedPair", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse("rt")));
    const { rotateTokens } = await importRotate();

    await expect(rotateTokens("rt")).resolves.toEqual({
      status: "rotated",
      tokens: tokensFor("rt"),
    });
  });

  it("rotateTokens_sameTokenConcurrently_rotatesOnlyOnce", async () => {
    const gate = deferred();
    const fetchMock = vi.fn().mockImplementation(async () => {
      await gate.gate;
      return okResponse("rt");
    });
    vi.stubGlobal("fetch", fetchMock);
    const { rotateTokens } = await importRotate();

    const first = rotateTokens("rt");
    const second = rotateTokens("rt");
    gate.release();

    await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rotateTokens_twoDifferentUsersConcurrently_neverShareARotation", async () => {
    const gate = deferred();
    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      await gate.gate;
      const { refreshToken } = JSON.parse(String(init.body)) as {
        refreshToken: string;
      };
      return okResponse(refreshToken);
    });
    vi.stubGlobal("fetch", fetchMock);
    const { rotateTokens } = await importRotate();

    const alice = rotateTokens("alice-rt");
    const bob = rotateTokens("bob-rt");
    gate.release();

    await expect(Promise.all([alice, bob])).resolves.toEqual([
      { status: "rotated", tokens: tokensFor("alice-rt") },
      { status: "rotated", tokens: tokensFor("bob-rt") },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rotateTokens_afterCompletion_allowsANewRotation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("rt"));
    vi.stubGlobal("fetch", fetchMock);
    const { rotateTokens } = await importRotate();

    await rotateTokens("rt");
    await rotateTokens("rt");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403])(
    "rotateTokens_status%i_isRejectedSoTheSessionIsCleared",
    async (status) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(status)));
      const { rotateTokens } = await importRotate();

      await expect(rotateTokens("rt")).resolves.toEqual({ status: "rejected" });
    },
  );

  it.each([404, 408, 429, 500, 502, 503])(
    "rotateTokens_status%i_isUnreachableSoTheTokenSurvives",
    async (status) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(status)));
      const { rotateTokens } = await importRotate();

      await expect(rotateTokens("rt")).resolves.toEqual({
        status: "unreachable",
      });
    },
  );

  it("rotateTokens_networkFailure_isUnreachableSoTheTokenSurvives", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
    const { rotateTokens } = await importRotate();

    await expect(rotateTokens("rt")).resolves.toEqual({
      status: "unreachable",
    });
  });

  it("rotateTokens_gatewayCall_carriesTheTokenInTheBodyAndNeverInAHeader", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("rt"));
    vi.stubGlobal("fetch", fetchMock);
    const { rotateTokens } = await importRotate();

    await rotateTokens("rt");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://gateway:8080/api/auth/refresh");
    expect(init.body).toBe(JSON.stringify({ refreshToken: "rt" }));
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
