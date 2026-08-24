import type { BrowserContext } from "@playwright/test";

export const acceptCookies = async (
  context: BrowserContext,
  maps = true,
): Promise<void> => {
  await context.addCookies([
    {
      name: "peaker_cc",
      value: encodeURIComponent(
        JSON.stringify({ maps, decidedAtUtc: new Date().toISOString() }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
};
