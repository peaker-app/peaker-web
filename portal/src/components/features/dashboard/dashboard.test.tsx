import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";
import { ApiError } from "@/lib/api/client";
import type {
  AscentSummaryResponse,
  PagedResponse,
  ProfileStatsResponse,
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

const { DashboardStats } = await import("./DashboardStats");
const { RecentAscents } = await import("./RecentAscents");
const { DashboardGreeting } = await import("./DashboardGreeting");
const { UnconfirmedEmailBanner } = await import("./UnconfirmedEmailBanner");
const { useEmailConfirmation } = await import("@/stores/emailConfirmation");

const stats: ProfileStatsResponse = {
  totalAscents: 12,
  distinctPeaks: 9,
  highestAltitudeMeters: 3404,
  highestPeakId: "peak-1",
  highestPeakName: "Aneto",
  lastAscentDate: "2026-07-20",
};

const ascents = (
  items: AscentSummaryResponse[],
): PagedResponse<AscentSummaryResponse> => ({
  items,
  page: 1,
  size: 5,
  totalCount: items.length,
  totalPages: 1,
});

const ascent: AscentSummaryResponse = {
  id: "ascent-1",
  peakId: "peak-1",
  peakName: "Aneto",
  peakAltitudeMeters: 3404,
  ascentDate: "2026-07-20",
  visibility: "Public",
  thumbnailUrl: null,
};

const renderAsync = async (element: Promise<ReactNode>) =>
  render(await element, { wrapper: IntlWrapper });

beforeEach(() => {
  useEmailConfirmation.setState({ unconfirmed: false });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardStats", () => {
  it("dashboardStats_available_showsTheFiguresWithTheEventualConsistencyNote", async () => {
    serverFetch.mockResolvedValue(stats);

    await renderAsync(DashboardStats());

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.getByText("Updated in a few seconds."),
    ).toBeInTheDocument();
  });

  it("dashboardStats_profileNotReadyYet_explainsInsteadOfShowingA404", async () => {
    serverFetch.mockRejectedValue(new ApiError({ status: 404 }));

    await renderAsync(DashboardStats());

    expect(screen.getByText("Preparing your profile…")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("dashboardStats_otherFailure_isScopedToItsOwnBlock", async () => {
    serverFetch.mockRejectedValue(new ApiError({ status: 503 }));

    await renderAsync(DashboardStats());

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});

describe("RecentAscents", () => {
  it("recentAscents_withAscents_listsThemAndLinksToAll", async () => {
    serverFetch.mockResolvedValue(ascents([ascent]));

    await renderAsync(RecentAscents());

    expect(screen.getByRole("link", { name: /Aneto/ })).toHaveAttribute(
      "href",
      "/dashboard/ascents/ascent-1",
    );
    expect(screen.getByRole("link", { name: "See them all" })).toBeInTheDocument();
  });

  it("recentAscents_noneYet_invitesToLogTheFirstOne", async () => {
    serverFetch.mockResolvedValue(ascents([]));

    await renderAsync(RecentAscents());

    expect(
      screen.getByText("You haven't logged a summit yet"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("recentAscents_failure_doesNotHideTheRestOfThePanel", async () => {
    serverFetch.mockRejectedValue(new ApiError({ status: 503 }));

    await renderAsync(RecentAscents());

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("DashboardGreeting", () => {
  it("dashboardGreeting_withProfile_greetsByName", async () => {
    serverFetch.mockResolvedValue({ displayName: "Rubén" });

    await renderAsync(DashboardGreeting());

    expect(
      screen.getByRole("heading", { level: 1, name: "Hello, Rubén" }),
    ).toBeInTheDocument();
  });

  it("dashboardGreeting_profileUnavailable_fallsBackToTheGenericTitle", async () => {
    serverFetch.mockRejectedValue(new ApiError({ status: 404 }));

    await renderAsync(DashboardGreeting());

    expect(
      screen.getByRole("heading", { level: 1, name: "Your dashboard" }),
    ).toBeInTheDocument();
  });
});

describe("UnconfirmedEmailBanner", () => {
  it("unconfirmedEmailBanner_byDefault_isNotRendered", () => {
    const { container } = render(<UnconfirmedEmailBanner />, {
      wrapper: IntlWrapper,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("unconfirmedEmailBanner_afterA403_informsWithoutInterrupting", () => {
    useEmailConfirmation.setState({ unconfirmed: true });
    render(<UnconfirmedEmailBanner />, { wrapper: IntlWrapper });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Send me the link again" }),
    ).toHaveAttribute("href", "/confirm-email/pending");
  });
});
