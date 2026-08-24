import { expect, test } from "@playwright/test";
import { acceptCookies } from "./consent";

test.beforeEach(async ({ context }) => acceptCookies(context));

test.describe("Enrutado localizado", () => {
  test("cada locale se sirve bajo su propio prefijo", async ({ page }) => {
    for (const locale of ["en", "es", "zh", "fr", "ar"]) {
      await page.goto(`/${locale}`);

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }
  });

  test("el arabe se renderiza de derecha a izquierda", async ({ page }) => {
    await page.goto("/ar");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("el resto de idiomas se renderizan de izquierda a derecha", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("la raiz sin prefijo redirige a un locale", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/(en|es|zh|fr|ar)$/);
  });
});

test.describe("Rutas sin prefijo que deben sobrevivir", () => {
  test("confirm-email entrega el token al redirigir con locale", async ({
    page,
  }) => {
    const bodies: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/bff/auth/email/confirm")) {
        bodies.push(request.postData() ?? "");
      }
    });

    await page.goto("/confirm-email?token=abc123");

    await expect(page).toHaveURL(/\/(en|es|zh|fr|ar)\/confirm-email$/);
    expect(bodies).toEqual([JSON.stringify({ token: "abc123" })]);
  });

  test("confirm-email no deja el token en la barra de direcciones", async ({
    page,
  }) => {
    await page.goto("/confirm-email?token=abc123");
    await expect(page.getByRole("heading")).toBeVisible();

    expect(new URL(page.url()).search).toBe("");
  });
});

test.describe("Guard de rutas privadas", () => {
  test("el panel sin sesion redirige al login conservando el destino", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/ascents");

    await expect(page).toHaveURL(
      /\/en\/login\?next=%2Fen%2Fdashboard%2Fascents$/,
    );
  });
});

test.describe("Accesibilidad transversal", () => {
  test("el primer elemento enfocable es el enlace de salto al contenido", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.keyboard.press("Tab");

    await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  });
});
