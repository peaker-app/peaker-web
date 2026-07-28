import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { LoginForm } = await import("./LoginForm");

const respondWith = (status: number, body: unknown = {}) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      json: async () => body,
    }),
  );

const signIn = async (identifier = "ruben", password = "secret1234") => {
  await userEvent.type(screen.getByLabelText("Email or username"), identifier);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("loginForm_singleIdentifierField_coversEmailAndUsername", () => {
    render(<LoginForm />, { wrapper: IntlWrapper });

    expect(screen.getByLabelText("Email or username")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email address")).toBeNull();
  });

  it("loginForm_identifierField_isLeftToRightEvenInArabic", () => {
    render(<LoginForm />, {
      wrapper: ({ children }) => (
        <IntlWrapper locale="ar">{children}</IntlWrapper>
      ),
    });

    expect(
      screen.getByLabelText("البريد الإلكتروني أو اسم المستخدم"),
    ).toHaveAttribute("dir", "ltr");
  });

  it("loginForm_validCredentials_sendsTheIdentifierUntouched", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn("  Ruben@Correo.ES  ");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      identifier: "  Ruben@Correo.ES  ",
      password: "secret1234",
    });
  });

  it("loginForm_success_navigatesToTheDashboardByDefault", async () => {
    respondWith(204);
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("loginForm_successWithSafeNext_honoursTheDestination", async () => {
    respondWith(204);
    render(<LoginForm next="/en/dashboard/ascents" />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/dashboard/ascents"),
    );
  });

  it("loginForm_rejectedCredentials_showsOneGenericMessage", async () => {
    respondWith(401, { title: "User.InvalidCredentials" });
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Those credentials aren't valid.",
      ),
    );
  });

  it("loginForm_rejectedCredentials_neverBlamesAField", async () => {
    respondWith(401, { title: "User.InvalidCredentials" });
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByLabelText("Email or username")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Password")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("loginForm_rejectedCredentials_returnsFocusToTheIdentifier", async () => {
    respondWith(401, { title: "User.InvalidCredentials" });
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() =>
      expect(screen.getByLabelText("Email or username")).toHaveFocus(),
    );
  });

  it("loginForm_rateLimited_disablesTheButton", async () => {
    respondWith(429);
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled(),
    );
  });

  it("loginForm_serverError_showsTheStatusFallback", async () => {
    respondWith(503, {});
    render(<LoginForm />, { wrapper: IntlWrapper });

    await signIn();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Service temporarily unavailable.",
      ),
    );
  });
});
