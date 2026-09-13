import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { PeakLinkCard, peakCardFromAscent } = await import("./PeakLinkCard");

const aneto = {
  id: "peak-1",
  name: "Aneto",
  altitudeMeters: 3404,
  countryCode: "ES",
  region: "Pyrenees",
};

describe("PeakLinkCard", () => {
  it("peakLinkCard_anyPeak_linksToItsDetailScreen", () => {
    render(<PeakLinkCard peak={aneto} />, { wrapper: IntlWrapper });

    expect(screen.getByRole("link")).toHaveAttribute("href", "/peaks/peak-1");
  });

  it("peakLinkCard_link_namesThePeakInItsAccessibleName", () => {
    render(<PeakLinkCard peak={aneto} />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("link", { name: "See the page for Aneto" }),
    ).toBeInTheDocument();
  });

  it("peakLinkCard_anyPeak_spellsOutTheAction", () => {
    render(<PeakLinkCard peak={aneto} />, { wrapper: IntlWrapper });

    expect(screen.getByText("See the peak page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The peak" }),
    ).toBeInTheDocument();
  });

  it("peakLinkCard_knownPlace_isShownNextToTheAltitude", () => {
    render(<PeakLinkCard peak={aneto} />, { wrapper: IntlWrapper });

    expect(screen.getByText("3,404 m · Pyrenees, Spain")).toBeInTheDocument();
  });

  it("peakLinkCard_unknownPlace_leavesTheAltitudeAlone", () => {
    render(
      <PeakLinkCard peak={{ ...aneto, countryCode: null, region: null }} />,
      { wrapper: IntlWrapper },
    );

    expect(screen.getByText("3,404 m")).toBeInTheDocument();
  });

  it("peakLinkCard_withoutPhoto_fallsBackToTheMountainIcon", () => {
    const { container } = render(<PeakLinkCard peak={aneto} />, {
      wrapper: IntlWrapper,
    });

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("peakLinkCard_withPhoto_showsADecorativeThumbnail", () => {
    render(
      <PeakLinkCard
        peak={{
          ...aneto,
          imageUrl:
            "https://commons.wikimedia.org/wiki/Special:FilePath/Aneto.jpg",
        }}
      />,
      { wrapper: IntlWrapper },
    );

    expect(screen.getByAltText("")).toHaveAttribute(
      "src",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Aneto.jpg?width=128",
    );
  });

  it("peakLinkCard_nameIsAWikidataIdentifier_showsThePlaceholderInstead", () => {
    render(<PeakLinkCard peak={{ ...aneto, name: "Q8538208" }} />, {
      wrapper: IntlWrapper,
    });

    expect(screen.getByRole("link")).toHaveTextContent(
      "Unnamed peak (Q8538208)",
    );
  });
});

const ascent = {
  peakId: "peak-9",
  peakName: "Monte Naranco",
  peakAltitudeMeters: 634,
} as Parameters<typeof peakCardFromAscent>[0];

describe("peakCardFromAscent", () => {
  it("peakCardFromAscent_peakWasLoaded_prefersItsRicherData", () => {
    expect(peakCardFromAscent(ascent, { ...aneto } as never)).toMatchObject({
      id: "peak-1",
      region: "Pyrenees",
    });
  });

  it("peakCardFromAscent_peakServiceFailed_fallsBackToTheAscentFields", () => {
    expect(peakCardFromAscent(ascent, undefined)).toEqual({
      id: "peak-9",
      name: "Monte Naranco",
      altitudeMeters: 634,
      countryCode: null,
      region: null,
    });
  });
});
