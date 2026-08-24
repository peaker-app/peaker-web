import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { ConfirmEmailView } = await import("./ConfirmEmailView");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const confirmResponse = (status: number, body: unknown = {}) => ({
  ok: status < 400,
  status,
  json: async () => body,
});

const sessionResponse = {
  ok: true,
  status: 200,
  json: async () => ({ authenticated: false, userId: null, email: null }),
};

const stubFetch = (confirm: ReturnType<typeof confirmResponse>) => {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (url: string) => {
    calls.push(url);

    return url.includes("email/confirm") ? confirm : sessionResponse;
  });
  vi.stubGlobal("fetch", fetchMock);

  return {
    confirmCalls: () => calls.filter((url) => url.includes("email/confirm")),
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConfirmEmailView", () => {
  it("confirmEmailView_withToken_confirmsAndReportsSuccess", async () => {
    stubFetch(confirmResponse(204));
    render(<ConfirmEmailView token="abc123" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText("Your email is confirmed")).toBeInTheDocument(),
    );
  });

  it("confirmEmailView_underStrictMode_callsTheOneShotEndpointOnlyOnce", async () => {
    const { confirmCalls } = stubFetch(confirmResponse(204));

    render(
      <StrictMode>
        <Wrapper>
          <ConfirmEmailView token="abc123" />
        </Wrapper>
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByText("Your email is confirmed")).toBeInTheDocument(),
    );
    expect(confirmCalls()).toHaveLength(1);
  });

  it("confirmEmailView_alreadyConfirmed_isTreatedAsSuccessNotFailure", async () => {
    stubFetch(confirmResponse(409, { title: "User.EmailAlreadyConfirmed" }));
    render(<ConfirmEmailView token="abc123" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText("Your email was already confirmed"),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("We couldn't confirm your email")).toBeNull();
  });

  it("confirmEmailView_expiredToken_offersToRequestANewLink", async () => {
    stubFetch(
      confirmResponse(400, { title: "EmailConfirmation.InvalidOrExpired" }),
    );
    render(<ConfirmEmailView token="abc123" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Request a new link" }),
      ).toHaveAttribute("href", "/confirm-email/pending"),
    );
  });

  it("confirmEmailView_withoutToken_failsWithoutCallingTheApi", async () => {
    const { confirmCalls } = stubFetch(confirmResponse(204));
    render(<ConfirmEmailView />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText(
          "This link has no token. Open the most recent email we sent you.",
        ),
      ).toBeInTheDocument(),
    );
    expect(confirmCalls()).toHaveLength(0);
  });

  it("confirmEmailView_stateChanges_areAnnouncedPolitely", async () => {
    stubFetch(confirmResponse(204));
    const { container } = render(<ConfirmEmailView token="abc123" />, {
      wrapper: Wrapper,
    });

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
