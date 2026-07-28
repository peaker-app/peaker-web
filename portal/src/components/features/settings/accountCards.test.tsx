import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { ApiError } from "@/lib/api/client";

const apiFetch = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => "/dashboard/settings/account",
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );

  return { ...actual, apiFetch: (path: string, init?: RequestInit) => apiFetch(path, init) };
});

const { AccountCards } = await import("./AccountCards");
const { DeleteAccountDialog } = await import("./DeleteAccountDialog");
const { useEmailConfirmation } = await import("@/stores/emailConfirmation");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const stubSession = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        userId: "u1",
        email: "ruben@correo.es",
      }),
    }),
  );

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Close my account" }));

  return screen.getByRole("alertdialog");
};

beforeEach(() => {
  useEmailConfirmation.setState({ unconfirmed: false });
  stubSession();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("AccountCards", () => {
  it("accountCards_session_warnsAboutTheFifteenMinuteToken", () => {
    render(<AccountCards displayName="Rubén" />, { wrapper: Wrapper });

    expect(
      screen.getByText(/the access token stays valid for up to 15 minutes/),
    ).toBeInTheDocument();
    expect(screen.getByText(/close the browser as well/)).toBeInTheDocument();
  });

  it("accountCards_email_isShownLeftToRight", async () => {
    const { container } = render(<AccountCards displayName="Rubén" />, {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(container.querySelector('p[dir="ltr"]')).toHaveTextContent(
        "ruben@correo.es",
      ),
    );
  });

  it("accountCards_unconfirmedEmail_saysSoWithoutInventingAConfirmedState", () => {
    useEmailConfirmation.setState({ unconfirmed: true });
    render(<AccountCards displayName="Rubén" />, { wrapper: Wrapper });

    expect(
      screen.getByText("You haven't confirmed this address yet."),
    ).toBeInTheDocument();
  });

  it("accountCards_units_onlyOfferMetres", () => {
    render(<AccountCards displayName="Rubén" />, { wrapper: Wrapper });

    expect(screen.getByText("Units: Metres")).toBeInTheDocument();
    expect(screen.getByText("Feet aren't available yet.")).toBeInTheDocument();
  });

  it("accountCards_signOut_clearsTheSessionThroughTheRouteHandler", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({ authenticated: false, userId: null, email: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountCards displayName="Rubén" />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/");
  });
});

describe("DeleteAccountDialog", () => {
  it("deleteAccountDialog_enumeratesTheFourConsequences", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeleteAccountDialog confirmationName="Rubén" />, {
      wrapper: Wrapper,
    });

    const dialog = await openDialog(user);

    expect(within(dialog).getAllByRole("listitem")).toHaveLength(4);
    expect(dialog).toHaveTextContent(
      "Your email address and username will NOT be freed",
    );
    expect(dialog).toHaveTextContent("This can't be undone.");
    expect(dialog).toHaveTextContent("Every session will be closed");
  });

  it("deleteAccountDialog_beforeTyping_keepsTheDestructiveButtonDisabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeleteAccountDialog confirmationName="Rubén" />, {
      wrapper: Wrapper,
    });

    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("button", { name: "Close my account" }),
    ).toBeDisabled();
  });

  it("deleteAccountDialog_wrongText_keepsItDisabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeleteAccountDialog confirmationName="Rubén" />, {
      wrapper: Wrapper,
    });

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText("Confirmation"), "ruben");

    expect(
      within(dialog).getByRole("button", { name: "Close my account" }),
    ).toBeDisabled();
  });

  it("deleteAccountDialog_exactText_unlocksAndDeletes", async () => {
    apiFetch.mockResolvedValue(undefined);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeleteAccountDialog confirmationName="Rubén" />, {
      wrapper: Wrapper,
    });

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText("Confirmation"), "Rubén");
    await user.click(
      within(dialog).getByRole("button", { name: "Close my account" }),
    );

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith("auth/me", { method: "DELETE" }),
    );
  });

  it("deleteAccountDialog_success_clearsCookiesAndSaysGoodbye", async () => {
    apiFetch.mockResolvedValue(undefined);
    const logoutMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", logoutMock);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeleteAccountDialog confirmationName="Rubén" />, {
      wrapper: Wrapper,
    });

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText("Confirmation"), "Rubén");
    await user.click(
      within(dialog).getByRole("button", { name: "Close my account" }),
    );

    await waitFor(() =>
      expect(logoutMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/?deleted=1");
  });

  it("deleteAccountDialog_failure_reportsItWithoutNavigatingAway", async () => {
    apiFetch.mockRejectedValue(
      new ApiError({ status: 409, title: "User.AlreadyDeleted" }),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeleteAccountDialog confirmationName="Rubén" />, {
      wrapper: Wrapper,
    });

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText("Confirmation"), "Rubén");
    await user.click(
      within(dialog).getByRole("button", { name: "Close my account" }),
    );

    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "This account has already been closed.",
      ),
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
