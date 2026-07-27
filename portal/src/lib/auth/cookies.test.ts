import { afterEach, describe, expect, it, vi } from "vitest";

const store = { get: vi.fn(), set: vi.fn() };

vi.mock("next/headers", () => ({ cookies: async () => store }));

const { clearSessionCookies, readAccessToken, readRefreshToken, writeSessionCookies } =
  await import("./cookies");

const tokens = {
  accessToken: "at",
  refreshToken: "rt",
  expiresInSeconds: 900,
  tokenType: "Bearer",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("readAccessToken", () => {
  it("readAccessToken_cookiePresent_returnsItsValue", async () => {
    store.get.mockReturnValue({ value: "at" });

    await expect(readAccessToken()).resolves.toBe("at");
    expect(store.get).toHaveBeenCalledWith("peaker_at");
  });

  it("readAccessToken_cookieAbsent_returnsUndefined", async () => {
    store.get.mockReturnValue(undefined);

    await expect(readAccessToken()).resolves.toBeUndefined();
  });
});

describe("readRefreshToken", () => {
  it("readRefreshToken_cookiePresent_returnsItsValue", async () => {
    store.get.mockReturnValue({ value: "rt" });

    await expect(readRefreshToken()).resolves.toBe("rt");
    expect(store.get).toHaveBeenCalledWith("peaker_rt");
  });
});

describe("writeSessionCookies", () => {
  it("writeSessionCookies_accessToken_isHttpOnlyAndScopedToTheWholeSite", async () => {
    await writeSessionCookies(tokens);

    expect(store.set).toHaveBeenCalledWith(
      "peaker_at",
      "at",
      expect.objectContaining({ httpOnly: true, path: "/", maxAge: 900 }),
    );
  });

  it("writeSessionCookies_refreshToken_isScopedToTheAuthRoutes", async () => {
    await writeSessionCookies(tokens);

    expect(store.set).toHaveBeenCalledWith(
      "peaker_rt",
      "rt",
      expect.objectContaining({
        httpOnly: true,
        path: "/api/auth",
        sameSite: "lax",
      }),
    );
  });

  it("writeSessionCookies_refreshToken_livesForThirtyDays", async () => {
    await writeSessionCookies(tokens);

    const call = store.set.mock.calls.find(([name]) => name === "peaker_rt");

    expect(call?.[2]).toMatchObject({ maxAge: 60 * 60 * 24 * 30 });
  });
});

describe("clearSessionCookies", () => {
  it("clearSessionCookies_bothCookies_areExpiredOnTheirOwnPath", async () => {
    await clearSessionCookies();

    expect(store.set).toHaveBeenCalledWith(
      "peaker_at",
      "",
      expect.objectContaining({ maxAge: 0, path: "/" }),
    );
    expect(store.set).toHaveBeenCalledWith(
      "peaker_rt",
      "",
      expect.objectContaining({ maxAge: 0, path: "/api/auth" }),
    );
  });
});
