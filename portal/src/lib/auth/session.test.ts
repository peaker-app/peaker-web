import { afterEach, describe, expect, it, vi } from "vitest";

const readAccessToken = vi.fn();

vi.mock("./cookies", () => ({ readAccessToken: () => readAccessToken() }));

const { getSession } = await import("./session");

const encode = (payload: Record<string, unknown>): string =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

const inSeconds = (offset: number): number =>
  Math.floor(Date.now() / 1000) + offset;

afterEach(() => {
  vi.clearAllMocks();
});

describe("getSession", () => {
  it("getSession_validToken_returnsUserIdEmailAndToken", async () => {
    const token = encode({
      sub: "11111111-1111-1111-1111-111111111111",
      email: "ruben@correo.es",
      exp: inSeconds(900),
    });
    readAccessToken.mockResolvedValue(token);

    await expect(getSession()).resolves.toEqual({
      userId: "11111111-1111-1111-1111-111111111111",
      email: "ruben@correo.es",
      accessToken: token,
    });
  });

  it("getSession_withoutCookie_returnsUndefined", async () => {
    readAccessToken.mockResolvedValue(undefined);

    await expect(getSession()).resolves.toBeUndefined();
  });

  it("getSession_expiredToken_returnsUndefined", async () => {
    readAccessToken.mockResolvedValue(encode({ sub: "u", exp: inSeconds(-1) }));

    await expect(getSession()).resolves.toBeUndefined();
  });

  it("getSession_malformedToken_returnsUndefined", async () => {
    readAccessToken.mockResolvedValue("garbage");

    await expect(getSession()).resolves.toBeUndefined();
  });

  it("getSession_tokenWithoutEmailClaim_returnsEmptyEmail", async () => {
    readAccessToken.mockResolvedValue(encode({ sub: "u", exp: inSeconds(900) }));

    await expect(getSession()).resolves.toMatchObject({ email: "" });
  });
});
