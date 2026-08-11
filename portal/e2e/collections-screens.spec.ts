import { expect, test, type Page } from "@playwright/test";
import fixtures from "./fixtures.json";
import { acceptCookies } from "./consent";

const signIn = async (page: Page) => {
  await page.goto("/en/login");
  await page.getByLabel("Email or username", { exact: true }).fill(fixtures.validUsername);
  await page.getByLabel("Password", { exact: true }).fill(fixtures.validPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
};

const customPath = `/en/dashboard/collections/${fixtures.customCollectionId}`;
const defaultPath = `/en/dashboard/collections/${fixtures.defaultCollectionId}`;

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test.beforeEach(async ({ context }) => acceptCookies(context));

test.describe("SC-18 · mis colecciones", () => {
  test("el panel ofrece la entrada de colecciones", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "El sidebar no se pinta en movil");

    await page.getByRole("link", { name: "Collections" }).click();

    await expect(page).toHaveURL(/\/en\/dashboard\/collections$/);
  });

  test("la rejilla respeta el orden del servidor y traduce la por defecto", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/collections");

    const items = page.getByRole("listitem");
    await expect(items.first()).toContainText("Want to climb");
    await expect(items.first()).toContainText("Default");
    await expect(items.nth(1)).toContainText(fixtures.customCollectionName);
  });

  test("cada tarjeta declara cuantos picos tiene", async ({ page }) => {
    await page.goto("/en/dashboard/collections");

    await expect(page.getByText("1 peak").first()).toBeVisible();
  });

  test("crear una coleccion envia nombre y descripcion", async ({ page }) => {
    await page.goto("/en/dashboard/collections");
    await page.getByRole("button", { name: "New collection" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name", { exact: true }).fill("Pirineos");
    await dialog.getByLabel("Description", { exact: true }).fill("Los de casa.");
    await dialog.getByRole("button", { name: "Create collection" }).click();

    await expect(page.getByText("Collection created.")).toBeVisible();
  });

  test("un nombre repetido se muestra en linea y no cierra el dialogo", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/collections");
    await page.getByRole("button", { name: "New collection" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name", { exact: true }).fill(fixtures.takenCollectionName);
    await dialog.getByRole("button", { name: "Create collection" }).click();

    await expect(
      dialog.getByText("You already have a collection with that name."),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("un nombre vacio se rechaza sin llamar al gateway", async ({ page }) => {
    await page.goto("/en/dashboard/collections");
    await page.getByRole("button", { name: "New collection" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Create collection" }).click();

    await expect(dialog.getByText("Enter a name.")).toBeVisible();
  });

  test("la pantalla no se indexa", async ({ page }) => {
    await page.goto("/en/dashboard/collections");

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});

test.describe("SC-19 · detalle de coleccion", () => {
  test("la coleccion propia ofrece editar y borrar", async ({ page }) => {
    await page.goto(customPath);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fixtures.customCollectionName,
    );
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("la coleccion por defecto no pinta editar ni borrar", async ({ page }) => {
    await page.goto(defaultPath);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Want to climb",
    );
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  });

  test("anadir un pico lo confirma y cierra el dialogo", async ({ page }) => {
    await page.goto(customPath);

    await expect(page.getByText("1 peak")).toBeVisible();
    await page.getByRole("button", { name: "Add a peak" }).click();
    await page.getByLabel("Search a peak").fill(fixtures.peakName);
    await page.getByRole("option", { name: new RegExp(fixtures.peakName) }).click();

    await expect(page.getByText(`${fixtures.peakName} added.`)).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("quitar un pico no pide confirmacion", async ({ page }) => {
    await page.goto(customPath);

    await page
      .getByRole("button", {
        name: `Remove ${fixtures.otherPeakName} from the collection`,
      })
      .first()
      .click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText(`${fixtures.otherPeakName} removed.`)).toBeVisible();
  });

  test("borrar la coleccion pide confirmacion y vuelve al listado", async ({ page }) => {
    await page.goto(customPath);
    await page.getByRole("button", { name: "Delete" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Your ascents and the peak catalogue are not affected");
    await dialog.getByRole("button", { name: "Delete collection" }).click();

    await expect(page).toHaveURL(/\/en\/dashboard\/collections$/);
  });

  test("una coleccion ajena o inexistente da 404", async ({ page }) => {
    await page.goto(`/en/dashboard/collections/${fixtures.missingPeakId}`);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "This page doesn't exist",
    );
  });

  test("en arabe el detalle se espeja y la altitud mantiene digitos latinos", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "La tabla solo existe a partir de 768 px");

    await page.goto(`/ar/dashboard/collections/${fixtures.customCollectionId}`);

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("cell", { name: /3[.,]404/ })).toBeVisible();
  });
});

test.describe("SC-04 · anadir a coleccion desde la ficha", () => {
  test("con sesion, el dialogo lista las colecciones y anade el pico", async ({
    page,
  }) => {
    await page.goto(`/en/peaks/${fixtures.peakId}`);
    await page.getByRole("button", { name: "Add to a collection" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: fixtures.customCollectionName }).click();

    await expect(dialog.getByRole("status")).toContainText(
      `Added to ${fixtures.customCollectionName}.`,
    );
  });

  test("un pico ya presente es un aviso, no un error", async ({ page }) => {
    await page.goto(`/en/peaks/${fixtures.barePeakId}`);
    await page.getByRole("button", { name: "Add to a collection" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: fixtures.customCollectionName }).click();

    await expect(dialog.getByRole("status")).toContainText("It was already in");
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  });
});
