import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";
import { SkipLink, mainContentId } from "./SkipLink";

describe("SkipLink", () => {
  it("skipLink_render_pointsToTheMainContentLandmark", () => {
    render(<SkipLink />, { wrapper: IntlWrapper });

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      `#${mainContentId}`,
    );
  });

  it("skipLink_render_isVisuallyHiddenUntilFocused", () => {
    render(<SkipLink />, { wrapper: IntlWrapper });

    expect(screen.getByRole("link")).toHaveClass("sr-only");
  });
});
