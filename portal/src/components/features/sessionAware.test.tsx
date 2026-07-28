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

const { RegisterCta } = await import("./landing/RegisterCta");
const { PeakActions } = await import("./peaks/PeakActions");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const respondWith = (authenticated: boolean) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated, userId: null, email: null }),
    }),
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RegisterCta", () => {
  it("registerCta_anonymousVisitor_invitesToCreateAnAccount", async () => {
    respondWith(false);
    render(<RegisterCta />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Create account" }),
      ).toHaveAttribute("href", "/register"),
    );
  });

  it("registerCta_signedInClimber_pointsAtTheDashboardInstead", async () => {
    respondWith(true);
    render(<RegisterCta />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Go to my dashboard" }),
      ).toHaveAttribute("href", "/dashboard"),
    );
  });
});

describe("PeakActions", () => {
  it("peakActions_anonymousVisitor_sendsToLoginCarryingTheReturnPath", async () => {
    respondWith(false);
    render(<PeakActions peakId="peak-1" locale="es" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Log an ascent" })).toHaveAttribute(
        "href",
        "/login?next=%2Fes%2Fdashboard%2Fascents%2Fnew%3FpeakId%3Dpeak-1",
      ),
    );
  });

  it("peakActions_anonymousVisitor_explainsWhyAnAccountIsNeeded", async () => {
    respondWith(false);
    render(<PeakActions peakId="peak-1" locale="en" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText("You'll need an account to log an ascent."),
      ).toBeInTheDocument(),
    );
  });

  it("peakActions_signedInClimber_goesStraightToTheForm", async () => {
    respondWith(true);
    render(<PeakActions peakId="peak-1" locale="en" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Log an ascent" })).toHaveAttribute(
        "href",
        "/dashboard/ascents/new?peakId=peak-1",
      ),
    );
  });
});
