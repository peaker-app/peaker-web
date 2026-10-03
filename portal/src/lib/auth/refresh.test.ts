import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readAccessToken = vi.fn();
const readRefreshToken = vi.fn();
const writeSessionCookies = vi.fn();
const clearSessionCookies = vi.fn();
const rotateTokens = vi.fn();

vi.mock("./cookies", () => ({
  readAccessToken: () => readAccessToken(),
  readRefreshToken: () => readRefreshToken(),
  writeSessionCookies: (tokens: unknown) => writeSessionCookies(tokens),
  clearSessionCookies: () => clearSessionCookies(),
}));

vi.mock("./rotate", () => ({
  rotateTokens: (refreshToken: string) => rotateTokens(refreshToken),
}));

const encode = (payload: Record<string, unknown>): string =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

const usableToken = (): string =>
  encode({ sub: "u1", email: "a@b.es", exp: Math.floor(Date.now() / 1000) + 900 });

const expiredToken = (): string =>
  encode({ sub: "u1", email: "a@b.es", exp: Math.floor(Date.now() / 1000) - 1 });

const rotatedTokens = {
  accessToken: usableToken(),
  refreshToken: "new-rt",
  expiresInSeconds: 900,
  tokenType: "Bearer",
};

beforeEach(() => {
  readAccessToken.mockResolvedValue(undefined);
  readRefreshToken.mockResolvedValue("current-rt");
  writeSessionCookies.mockResolvedValue(undefined);
  clearSessionCookies.mockResolvedValue(undefined);
  rotateTokens.mockResolvedValue({ status: "rotated", tokens: rotatedTokens });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("refreshSession", () => {
  it("refreshSession_validRefreshToken_storesTheRotatedPair", async () => {
    const { refreshSession } = await import("./refresh");

    await expect(refreshSession()).resolves.toEqual({
      status: "rotated",
      tokens: rotatedTokens,
    });
    expect(rotateTokens).toHaveBeenCalledWith("current-rt");
    expect(writeSessionCookies).toHaveBeenCalledWith(rotatedTokens);
    expect(clearSessionCookies).not.toHaveBeenCalled();
  });

  it("refreshSession_rejectedByGateway_clearsTheSessionCookies", async () => {
    rotateTokens.mockResolvedValue({ status: "rejected" });
    const { refreshSession } = await import("./refresh");

    await expect(refreshSession()).resolves.toEqual({ status: "rejected" });
    expect(clearSessionCookies).toHaveBeenCalledOnce();
    expect(writeSessionCookies).not.toHaveBeenCalled();
  });

  it("refreshSession_unreachableGateway_keepsTheSessionCookies", async () => {
    rotateTokens.mockResolvedValue({ status: "unreachable" });
    const { refreshSession } = await import("./refresh");

    await expect(refreshSession()).resolves.toEqual({ status: "unreachable" });
    expect(clearSessionCookies).not.toHaveBeenCalled();
    expect(writeSessionCookies).not.toHaveBeenCalled();
  });

  it("refreshSession_withoutRefreshCookie_doesNotCallTheGateway", async () => {
    readRefreshToken.mockResolvedValue(undefined);
    const { refreshSession } = await import("./refresh");

    await expect(refreshSession()).resolves.toEqual({ status: "rejected" });
    expect(rotateTokens).not.toHaveBeenCalled();
    expect(clearSessionCookies).not.toHaveBeenCalled();
  });
});

describe("ensureSession", () => {
  it("ensureSession_withAUsableAccessToken_doesNotRotate", async () => {
    readAccessToken.mockResolvedValue(usableToken());
    const { ensureSession } = await import("./refresh");

    await expect(ensureSession()).resolves.toMatchObject({ userId: "u1" });
    expect(rotateTokens).not.toHaveBeenCalled();
  });

  it("ensureSession_withAnExpiredAccessToken_rotatesAndReturnsTheNewSession", async () => {
    readAccessToken.mockResolvedValue(expiredToken());
    const { ensureSession } = await import("./refresh");

    await expect(ensureSession()).resolves.toMatchObject({
      userId: "u1",
      accessToken: rotatedTokens.accessToken,
    });
    expect(rotateTokens).toHaveBeenCalledWith("current-rt");
  });

  it("ensureSession_whenRotationIsRejected_reportsNoSession", async () => {
    readAccessToken.mockResolvedValue(expiredToken());
    rotateTokens.mockResolvedValue({ status: "rejected" });
    const { ensureSession } = await import("./refresh");

    await expect(ensureSession()).resolves.toBeUndefined();
  });

  it("ensureSession_withoutAnyCookie_neverCallsTheGateway", async () => {
    readRefreshToken.mockResolvedValue(undefined);
    const { ensureSession } = await import("./refresh");

    await expect(ensureSession()).resolves.toBeUndefined();
    expect(rotateTokens).not.toHaveBeenCalled();
  });
});
