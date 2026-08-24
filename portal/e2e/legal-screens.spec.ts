import { expect, test } from "@playwright/test";

const documents = ["notice", "privacy", "cookies", "terms"] as const;

test.describe("SC-24 a SC-27 · documentos legales", () => {
  for (const document of documents) {
    test(`${document} responde y se pinta en los cinco idiomas`, async ({
      page,
    }) => {
      for (const locale of ["en", "es", "zh", "fr", "ar"]) {
        const response = await page.goto(`/${locale}/legal/${document}`);

        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    });
  }

  test("el pie enlaza los cuatro documentos", async ({ page }) => {
    await page.goto("/en/peaks");

    const footer = page.getByRole("navigation", { name: "Legal" });

    for (const name of [
      "Legal notice",
      "Privacy",
      "Cookies",
      "Terms of use",
    ]) {
      await expect(footer.getByRole("link", { name })).toBeVisible();
    }
  });
});

test.describe("SC-28 · consentimiento de cookies", () => {
  test("un visitante nuevo ve el banner con las tres opciones", async ({
    page,
  }) => {
    await page.goto("/en/peaks");

    const banner = page.getByRole("region", {
      name: "Cookies and the third-party map",
    });

    await expect(banner.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(
      banner.getByRole("button", { name: "Configure" }),
    ).toBeVisible();
  });

  test("al rechazar, el banner no reaparece al navegar", async ({ page }) => {
    await page.goto("/en/peaks");
    await page.getByRole("button", { name: "Reject" }).click();

    await page.goto("/en/legal/cookies");

    await expect(
      page.getByRole("region", { name: "Cookies and the third-party map" }),
    ).toHaveCount(0);
  });

  test("sin consentimiento no se pide ni un mosaico a OpenStreetMap", async ({
    page,
  }) => {
    const tileRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes("tile.openstreetmap.org")) {
        tileRequests.push(request.url());
      }
    });

    await page.goto("/en/peaks/nearby");
    await page.getByRole("button", { name: "Reject" }).click();
    await page.waitForTimeout(1000);

    expect(tileRequests).toEqual([]);
  });

  test("el enlace del pie reabre las preferencias y permite revocar", async ({
    page,
  }) => {
    await page.goto("/en/peaks");
    await page.getByRole("button", { name: "Accept" }).click();

    await page.getByRole("button", { name: "Cookie preferences" }).click();

    await expect(
      page.getByRole("dialog", { name: "Cookie preferences" }),
    ).toBeVisible();
    await expect(page.getByLabel("Third-party map (OpenStreetMap)")).toBeChecked();
  });
});
