import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getSession: () => getSession() }));

const { GET } = await import("./route");

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/session", () => {
  it("session_activeSession_reportsTheUserWithoutTheToken", async () => {
    getSession.mockResolvedValue({
      userId: "u1",
      email: "ruben@correo.es",
      accessToken: "eyJhbGciOiJSUzI1NiJ9.payload.signature",
    });

    const body = await (await GET()).json();

    expect(body).toEqual({
      authenticated: true,
      userId: "u1",
      email: "ruben@correo.es",
    });
    expect(body).not.toHaveProperty("accessToken");
    expect(JSON.stringify(body)).not.toContain("eyJhbGciOiJSUzI1NiJ9");
  });

  it("session_noSession_reportsAnonymous", async () => {
    getSession.mockResolvedValue(undefined);

    await expect((await GET()).json()).resolves.toEqual({
      authenticated: false,
      userId: null,
      email: null,
    });
  });
});
