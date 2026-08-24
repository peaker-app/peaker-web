import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";
import { consentCookieName, parseConsent } from "@/lib/legal/consent";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { CookieConsentGate } = await import("./CookieConsentGate");
const { PeakMap } = await import("@/components/features/peaks/PeakMap");

const clearConsentCookie = () => {
  document.cookie = `${consentCookieName}=; Path=/; Max-Age=0`;
};

const storedConsent = () =>
  parseConsent(
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${consentCookieName}=`))
      ?.slice(consentCookieName.length + 1),
  );

beforeEach(() => {
  clearConsentCookie();
  vi.resetModules();
});

afterEach(() => {
  clearConsentCookie();
  vi.restoreAllMocks();
});

describe("CookieConsentGate", () => {
  it("cookieBanner_withoutADecision_isShown", () => {
    render(<CookieConsentGate />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("region", { name: "Cookies and the third-party map" }),
    ).toBeInTheDocument();
  });

  it("cookieBanner_inFrench_keepsTheElisionBeforeTheProviderName", () => {
    render(
      <IntlWrapper locale="fr">
        <CookieConsentGate />
      </IntlWrapper>,
    );

    expect(screen.getByText(/serveurs d'OpenStreetMap/)).toBeInTheDocument();
  });

  it("cookieBanner_offersAcceptAndRejectWithEqualProminence", () => {
    render(<CookieConsentGate />, { wrapper: IntlWrapper });

    const accept = screen.getByRole("button", { name: "Accept" });
    const reject = screen.getByRole("button", { name: "Reject" });

    expect(accept.className).toBe(reject.className);
  });

  it("cookieBanner_reject_storesADecisionThatDeniesTheMap", async () => {
    const user = userEvent.setup();
    render(<CookieConsentGate />, { wrapper: IntlWrapper });

    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(storedConsent()?.maps).toBe(false);
  });

  it("cookieBanner_accept_storesADecisionThatAllowsTheMap", async () => {
    const user = userEvent.setup();
    render(<CookieConsentGate />, { wrapper: IntlWrapper });

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(storedConsent()?.maps).toBe(true);
  });

  it("cookieBanner_afterDeciding_disappears", async () => {
    const user = userEvent.setup();
    render(<CookieConsentGate />, { wrapper: IntlWrapper });

    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(
      screen.queryByRole("region", { name: "Cookies and the third-party map" }),
    ).not.toBeInTheDocument();
  });
});

describe("PeakMap", () => {
  const props = {
    points: [{ id: "p1", name: "Aneto", latitude: 42.6, longitude: 0.65 }],
  };

  it("peakMap_withoutConsent_rendersTheGateInsteadOfTheMap", () => {
    render(<PeakMap {...props} />, { wrapper: IntlWrapper });

    expect(
      screen.getByRole("button", { name: "Load the map" }),
    ).toBeInTheDocument();
  });

  it("peakMap_withoutConsent_explainsWhyBeforeLoading", () => {
    render(<PeakMap {...props} />, { wrapper: IntlWrapper });

    expect(
      screen.getByText(/loads from OpenStreetMap, which will see your IP/),
    ).toBeInTheDocument();
  });

  it("peakMap_loadingItOnce_replacesTheGate", async () => {
    const user = userEvent.setup();
    render(<PeakMap {...props} />, { wrapper: IntlWrapper });

    await user.click(screen.getByRole("button", { name: "Load the map" }));

    expect(
      screen.queryByRole("button", { name: "Load the map" }),
    ).not.toBeInTheDocument();
  });
});
