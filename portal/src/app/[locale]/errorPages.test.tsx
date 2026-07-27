import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const NotFoundPage = (await import("./not-found")).default;
const ErrorPage = (await import("./error")).default;

describe("SC-21 · not-found", () => {
  it("notFound_render_showsASingleHeadingWithTheReason", () => {
    render(<NotFoundPage />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("heading", { level: 1, name: "This page doesn't exist" }),
    ).toBeInTheDocument();
  });

  it("notFound_render_offersTwoWaysOut", () => {
    render(<NotFoundPage />, { wrapper: IntlWrapper });

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Search peaks" })).toHaveAttribute(
      "href",
      "/peaks",
    );
  });

  it("notFound_render_showsTheStatusCodeAsText", () => {
    render(<NotFoundPage />, { wrapper: IntlWrapper });

    expect(screen.getByText("404")).toBeInTheDocument();
  });
});

describe("SC-21 · error", () => {
  const error = Object.assign(new Error("boom"), { digest: "abc123" });

  it("error_render_movesFocusToTheHeading", () => {
    render(<ErrorPage error={error} reset={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("error_retryClicked_callsReset", async () => {
    const reset = vi.fn();
    render(<ErrorPage error={error} reset={reset} />, { wrapper: IntlWrapper });

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it("error_withDigest_showsItAsTechnicalReference", () => {
    render(<ErrorPage error={error} reset={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    expect(screen.getByText("abc123")).toBeInTheDocument();
  });

  it("error_withoutDigest_hidesTheTechnicalReference", () => {
    render(<ErrorPage error={new Error("boom")} reset={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    expect(screen.queryByText("Technical reference")).toBeNull();
  });
});
