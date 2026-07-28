import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";

const searchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParams()),
}));

const { FarewellNotice } = await import("./FarewellNotice");

afterEach(() => {
  vi.clearAllMocks();
});

describe("FarewellNotice", () => {
  it("farewellNotice_withoutTheFlag_rendersNothing", () => {
    searchParams.mockReturnValue("");
    const { container } = render(<FarewellNotice />, { wrapper: IntlWrapper });

    expect(container).toBeEmptyDOMElement();
  });

  it("farewellNotice_afterClosingTheAccount_saysGoodbye", () => {
    searchParams.mockReturnValue("deleted=1");
    render(<FarewellNotice />, { wrapper: IntlWrapper });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your account has been closed",
    );
  });

  it("farewellNotice_informsWithoutInterrupting", () => {
    searchParams.mockReturnValue("deleted=1");
    render(<FarewellNotice />, { wrapper: IntlWrapper });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("farewellNotice_otherValues_areIgnored", () => {
    searchParams.mockReturnValue("deleted=0");
    const { container } = render(<FarewellNotice />, { wrapper: IntlWrapper });

    expect(container).toBeEmptyDOMElement();
  });
});
