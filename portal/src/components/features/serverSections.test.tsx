import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";
import type {
  AscentSummaryResponse,
  PagedResponse,
  PeakListItemResponse,
  PublicProfileResponse,
} from "@/types/api";

const serverFetch = vi.fn();

vi.mock("@/lib/api/server", () => ({
  serverFetch: (path: string) => serverFetch(path),
}));

vi.mock("next-intl/server", async () => {
  const { serverIntlDouble } = await import("@/test/serverIntl");

  return serverIntlDouble;
});

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const { FeaturedPeaks } = await import("./peaks/FeaturedPeaks");
const { PublicAscentsList } = await import("./profile/PublicAscentsList");
const { ProfileHeader } = await import("./profile/ProfileHeader");

const paged = <T,>(items: T[]): PagedResponse<T> => ({
  items,
  page: 1,
  size: 20,
  totalCount: items.length,
  totalPages: 1,
});

const peak: PeakListItemResponse = {
  id: "peak-1",
  name: "Aneto",
  altitudeMeters: 3404,
  prominenceMeters: null,
  latitude: 42.63,
  longitude: 0.65,
  countryCode: "ES",
  region: null,
  imageUrl: null,
  imageAuthor: null,
  imageLicense: null,
};

const ascent: AscentSummaryResponse = {
  id: "ascent-1",
  peakId: "peak-1",
  peakName: "Aneto",
  peakAltitudeMeters: 3404,
  ascentDate: "2026-07-20",
  visibility: "Public",
  thumbnailUrl: null,
};

const profile: PublicProfileResponse = {
  userId: "user-1",
  displayName: "Rubén",
  slug: "ruben",
  bio: null,
  avatarUrl: null,
  countryCode: "ES",
  stats: {
    totalAscents: 3,
    distinctPeaks: 3,
    highestAltitudeMeters: 3404,
    highestPeakId: "peak-1",
    highestPeakName: "Aneto",
    lastAscentDate: "2026-07-20",
  },
};

const renderAsync = async (element: Promise<ReactNode>) =>
  render(await element, { wrapper: IntlWrapper });

afterEach(() => {
  vi.clearAllMocks();
});

describe("FeaturedPeaks", () => {
  it("featuredPeaks_populatedCatalogue_showsTheSection", async () => {
    serverFetch.mockResolvedValue(paged([peak]));

    await renderAsync(FeaturedPeaks());

    expect(screen.getByText("Featured peaks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Aneto/ })).toBeInTheDocument();
  });

  it("featuredPeaks_emptyCatalogue_omitsTheSectionEntirely", async () => {
    serverFetch.mockResolvedValue(paged([]));

    const { container } = render(await FeaturedPeaks(), {
      wrapper: IntlWrapper,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("featuredPeaks_catalogueFailure_neverBreaksTheLanding", async () => {
    serverFetch.mockRejectedValue(new Error("gateway down"));

    const { container } = render(await FeaturedPeaks(), {
      wrapper: IntlWrapper,
    });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("PublicAscentsList", () => {
  it("publicAscentsList_withAscents_listsThem", async () => {
    serverFetch.mockResolvedValue(paged([ascent]));

    await renderAsync(PublicAscentsList({ userId: "user-1" }));

    expect(screen.getByRole("link", { name: /Aneto/ })).toHaveAttribute(
      "href",
      "/ascents/ascent-1",
    );
  });

  it("publicAscentsList_noPublicAscents_isAnEmptyStateNotAnError", async () => {
    serverFetch.mockResolvedValue(paged([]));

    await renderAsync(PublicAscentsList({ userId: "user-1" }));

    expect(
      screen.getByText("This climber has no public ascents yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("publicAscentsList_directoryUnavailable_failsScopedToItsOwnBlock", async () => {
    serverFetch.mockRejectedValue(new Error("503"));

    await renderAsync(PublicAscentsList({ userId: "user-1" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("ProfileHeader", () => {
  it("profileHeader_displayName_isTheOnlyLevelOneHeading", () => {
    render(<ProfileHeader profile={profile} />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("heading", { level: 1, name: "Rubén" }),
    ).toBeInTheDocument();
  });

  it("profileHeader_withoutBio_explainsInsteadOfShowingAGap", () => {
    render(<ProfileHeader profile={profile} />, { wrapper: IntlWrapper });

    expect(
      screen.getByText("This climber hasn't written a bio yet."),
    ).toBeInTheDocument();
  });

  it("profileHeader_withoutAvatar_showsInitialsHiddenFromScreenReaders", () => {
    render(<ProfileHeader profile={profile} />, { wrapper: IntlWrapper });

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("profileHeader_withAvatar_labelsItWithTheClimberName", () => {
    render(
      <ProfileHeader profile={{ ...profile, avatarUrl: "https://img/a.jpg" }} />,
      { wrapper: IntlWrapper },
    );

    expect(screen.getByAltText("Rubén's avatar")).toBeInTheDocument();
  });

  it("profileHeader_country_isTranslatedByTheRuntime", () => {
    render(<ProfileHeader profile={profile} />, { wrapper: IntlWrapper });

    expect(screen.getByText("Spain")).toBeInTheDocument();
  });
});
