import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";

vi.mock("@/i18n/navigation", () => ({
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
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "href",
        "/dashboard",
      ),
    );
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
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
