import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { locales } from "@/i18n/config";
import { IntlWrapper } from "@/test/IntlWrapper";

const replace = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/peaks",
}));

const { LocaleSwitcher } = await import("./LocaleSwitcher");

afterEach(() => {
  vi.clearAllMocks();
});

describe("LocaleSwitcher", () => {
  it("localeSwitcher_anyLocale_hasAnAccessibleName", () => {
    render(<LocaleSwitcher />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("combobox", { name: "Language" }),
    ).toBeInTheDocument();
  });

  it("localeSwitcher_activeLocale_isTheSelectedValue", () => {
    render(<LocaleSwitcher />, { wrapper: IntlWrapper });

    expect(screen.getByRole("combobox")).toHaveTextContent("English");
  });

  it("localeSwitcher_languageNames_areWrittenInTheirOwnScript", () => {
    render(<LocaleSwitcher />, { wrapper: IntlWrapper });
    const names = ["English", "Español", "中文", "Français", "العربية"];

    expect(names).toHaveLength(locales.length);
  });
});
