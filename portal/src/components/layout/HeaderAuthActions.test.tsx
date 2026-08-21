import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { HeaderAuthActions } = await import("./HeaderAuthActions");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const respondWith = (body: unknown) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => body }),
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HeaderAuthActions", () => {
  it("headerAuthActions_authenticatedSession_linksToTheDashboard", async () => {
    respondWith({ authenticated: true, userId: "u1", email: "a@b.es" });
    render(<HeaderAuthActions />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "My activity" })).toHaveAttribute(
        "href",
        "/dashboard",
      ),
    );
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("headerAuthActions_signOut_revokesTheSessionAndGoesHome", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ authenticated: true, userId: "u1", email: "a@b.es" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<HeaderAuthActions />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("headerAuthActions_anonymousVisitor_offersSignInAndSignUp", async () => {
    respondWith({ authenticated: false, userId: null, email: null });
    render(<HeaderAuthActions />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/login",
      ),
    );
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("headerAuthActions_whileResolving_showsASkeletonInsteadOfWrongLinks", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<HeaderAuthActions />, { wrapper: Wrapper });

    expect(screen.queryByRole("link")).toBeNull();
  });
});
