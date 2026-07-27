import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Noto_Sans: () => ({ variable: "--latin" }),
  Noto_Sans_Arabic: () => ({ variable: "--arabic" }),
  Noto_Sans_SC: () => ({ variable: "--sc" }),
}));

const { fontClassName, leadingClassName } = await import("./fonts");

describe("fontClassName", () => {
  it("fontClassName_arabicLocale_loadsTheArabicSubset", () => {
    expect(fontClassName("ar")).toBe("--arabic");
  });

  it("fontClassName_chineseLocale_loadsTheSimplifiedChineseSubset", () => {
    expect(fontClassName("zh")).toBe("--sc");
  });

  it.each(["en", "es", "fr"] as const)(
    "fontClassName_%sLocale_loadsTheLatinSubset",
    (locale) => {
      expect(fontClassName(locale)).toBe("--latin");
    },
  );
});

describe("leadingClassName", () => {
  it.each(["ar", "zh"] as const)(
    "leadingClassName_%sLocale_relaxesTheLineHeight",
    (locale) => {
      expect(leadingClassName(locale)).toBe("leading-relaxed");
    },
  );

  it.each(["en", "es", "fr"] as const)(
    "leadingClassName_%sLocale_keepsTheDefault",
    (locale) => {
      expect(leadingClassName(locale)).toBe("");
    },
  );
});
