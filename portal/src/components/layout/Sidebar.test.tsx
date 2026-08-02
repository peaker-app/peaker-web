import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";

const pathname = vi.fn();

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

const { Sidebar } = await import("./Sidebar");

afterEach(() => {
  vi.clearAllMocks();
});

describe("Sidebar", () => {
  it("sidebar_anyRoute_listsTheFiveSections", () => {
    pathname.mockReturnValue("/dashboard");
    render(<Sidebar />, { wrapper: IntlWrapper });

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "My activity",
      "My ascents",
      "Collections",
      "Profile",
      "Account",
    ]);
  });

  it("sidebar_collectionsRoute_marksCollectionsAsCurrent", () => {
    pathname.mockReturnValue("/dashboard/collections/abc");
    render(<Sidebar />, { wrapper: IntlWrapper });

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
    render(<Sidebar />, { wrapper: IntlWrapper });

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
    render(<Sidebar />, { wrapper: IntlWrapper });

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
    render(<Sidebar />, { wrapper: IntlWrapper });

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
    render(<Sidebar />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
  });
});
