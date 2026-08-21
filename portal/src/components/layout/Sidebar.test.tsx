import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";

const pathname = vi.fn();
const apiFetch = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname(),
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );

  return { ...actual, apiFetch: (path: string) => apiFetch(path) };
});

const { Sidebar } = await import("./Sidebar");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <IntlWrapper>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  </IntlWrapper>
);

const withProfile = () => apiFetch.mockResolvedValue({ slug: "ruben" });

const withoutProfile = () => apiFetch.mockRejectedValue(new Error("no profile"));

beforeEach(() => {
  withoutProfile();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sidebar", () => {
  it("sidebar_withoutAProfileYet_listsTheFiveSections", async () => {
    pathname.mockReturnValue("/dashboard");
    render(<Sidebar />, { wrapper: Wrapper });

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("profiles/me"));
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "My activity",
      "My ascents",
      "Collections",
      "Profile",
      "Account",
    ]);
  });

  it("sidebar_withAProfile_addsPublicProfileUnderProfile", async () => {
    withProfile();
    pathname.mockReturnValue("/dashboard");
    render(<Sidebar />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getAllByRole("link").map((link) => link.textContent),
      ).toEqual([
        "My activity",
        "My ascents",
        "Collections",
        "Profile",
        "Public profile",
        "Account",
      ]),
    );
    expect(
      screen.getByRole("link", { name: "Public profile" }),
    ).toHaveAttribute("href", "/climbers/ruben");
  });

  it("sidebar_collectionsRoute_marksCollectionsAsCurrent", () => {
    pathname.mockReturnValue("/dashboard/collections/abc");
    render(<Sidebar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "Collections" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "My activity" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sidebar_dashboardRoot_marksOnlyTheDashboardAsCurrent", () => {
    pathname.mockReturnValue("/dashboard");
    render(<Sidebar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "My activity" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "My ascents" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sidebar_nestedRoute_marksItsSectionAsCurrent", () => {
    pathname.mockReturnValue("/dashboard/ascents/new");
    render(<Sidebar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "My ascents" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "My activity" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sidebar_settingsRoute_distinguishesProfileFromAccount", () => {
    pathname.mockReturnValue("/dashboard/settings/account");
    render(<Sidebar />, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Profile" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sidebar_navigation_hasAnAccessibleName", () => {
    pathname.mockReturnValue("/dashboard");
    render(<Sidebar />, { wrapper: Wrapper });

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
  });
});
