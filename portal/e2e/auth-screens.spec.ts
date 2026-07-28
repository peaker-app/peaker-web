import { expect, test } from "@playwright/test";
import fixtures from "./fixtures.json";

const fillRegister = async (
  page: import("@playwright/test").Page,
  email: string,
) => {
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Username", { exact: true }).fill(fixtures.validUsername);
  await page.getByLabel("Password", { exact: true }).fill(fixtures.validPassword);
  await page.getByRole("button", { name: "Create account" }).click();
};

const signIn = async (
  page: import("@playwright/test").Page,
  password: string,
) => {
  await page.getByLabel("Email or username", { exact: true }).fill(fixtures.validUsername);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
};

test.describe("SC-07 · registro", () => {
  test("el alta correcta no inicia sesion y lleva al login con aviso", async ({
    page,
  }) => {
    await page.goto("/en/register");
    await fillRegister(page, fixtures.validEmail);

    await expect(page).toHaveURL(/\/en\/login\?registered=1$/);
    await expect(page.getByRole("status")).toContainText(
      "Check your inbox for the confirmation link",
    );
    await expect(page.context().cookies()).resolves.toHaveLength(0);
  });

  test("un correo ya registrado se marca en su campo y ofrece entrar", async ({
    page,
  }) => {
    await page.goto("/en/register");
    await fillRegister(page, fixtures.registeredEmail);

    await expect(page.getByLabel("Email address", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page.getByRole("link", { name: "Sign in instead" }),
    ).toBeVisible();
  });

  test("no se pintan botones de login social mientras no exista el endpoint", async ({
    page,
  }) => {
    await page.goto("/en/register");

    await expect(page.getByRole("button", { name: /Google|Apple/ })).toHaveCount(
      0,
    );
  });
});

test.describe("SC-08 · inicio de sesión", () => {
  test("las credenciales correctas fijan cookies httpOnly y llevan al panel", async ({
    page,
  }) => {
    await page.goto("/en/login");
    await signIn(page, fixtures.validPassword);

    await expect(page).toHaveURL(/\/en\/dashboard$/);

    const cookies = await page.context().cookies();
    const access = cookies.find((cookie) => cookie.name === "peaker_at");

    expect(access?.httpOnly).toBe(true);
    expect(cookies.find((cookie) => cookie.name === "peaker_rt")?.httpOnly).toBe(
      true,
    );
  });

  test("unas credenciales malas dan un mensaje generico sin culpar a un campo", async ({
    page,
  }) => {
    await page.goto("/en/login");
    await signIn(page, "contrasena-incorrecta");

    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Those credentials aren't valid.",
    );
    await expect(page.getByLabel("Email or username", { exact: true })).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test("no se ofrece recuperar la contrasena porque no hay endpoint", async ({
    page,
  }) => {
    await page.goto("/en/login");

    await expect(page.getByText(/forgot/i)).toHaveCount(0);
  });

  test("un next relativo se respeta", async ({ page }) => {
    await page.goto("/en/login?next=%2Fen%2Fpeaks");
    await signIn(page, fixtures.validPassword);

    await expect(page).toHaveURL(/\/en\/peaks$/);
  });

  test("un next hacia otro dominio se ignora", async ({ page }) => {
    await page.goto("/en/login?next=%2F%2Fevil.com");
    await signIn(page, fixtures.validPassword);

    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });
});

test.describe("SC-09 · confirmación de correo", () => {
  test("el enlace del correo sin locale conserva el token y confirma", async ({
    page,
  }) => {
    await page.goto(`/confirm-email?token=${fixtures.validToken}`);

    await expect(page).toHaveURL(
      new RegExp(`/(en|es|zh|fr|ar)/confirm-email\\?token=${fixtures.validToken}$`),
    );
    await expect(page.getByText("Your email is confirmed")).toBeVisible();
  });

  test("un correo ya confirmado se trata como exito", async ({ page }) => {
    await page.goto(`/en/confirm-email?token=${fixtures.confirmedToken}`);

    await expect(
      page.getByText("Your email was already confirmed"),
    ).toBeVisible();
  });

  test("un token caducado ofrece pedir uno nuevo", async ({ page }) => {
    await page.goto(`/en/confirm-email?token=${fixtures.expiredToken}`);

    await expect(
      page.getByRole("link", { name: "Request a new link" }),
    ).toBeVisible();
  });

  test("sin token no se llama a la API", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (request) => calls.push(request.url()));

    await page.goto("/en/confirm-email");

    await expect(
      page.getByText("This link has no token."),
    ).toBeVisible();
    expect(calls.filter((url) => url.includes("email/confirm"))).toHaveLength(0);
  });
});

test.describe("SC-10 · reenvío", () => {
  test("sin sesion redirige al login conservando el destino", async ({
    page,
  }) => {
    await page.goto("/en/confirm-email/pending");

    await expect(page).toHaveURL(/\/en\/login\?next=/);
  });

  test("con sesion, reenviar arranca el contador y deshabilita el boton", async ({
    page,
  }) => {
    await page.goto("/en/login");
    await signIn(page, fixtures.validPassword);
    await expect(page).toHaveURL(/\/en\/dashboard$/);

    await page.goto("/en/confirm-email/pending");
    await page.getByRole("button", { name: "Resend link" }).click();

    await expect(page.getByRole("status")).toContainText("Link sent");
    await expect(page.getByRole("button", { name: "Resend link" })).toBeDisabled();
  });
});

test.describe("Guard de sesión", () => {
  test("el panel sin sesion sigue redirigiendo al login", async ({ page }) => {
    await page.goto("/en/dashboard");

    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fdashboard$/);
  });
});
