import { defineConfig, devices } from "@playwright/test";

const stubPort = process.env.STUB_GATEWAY_PORT ?? "8080";
const portalPort = process.env.PORT ?? "3000";
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${portalPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "node e2e/stub-gateway.mjs",
          url: `http://localhost:${stubPort}/api/peaks`,
          reuseExistingServer: false,
          timeout: 30_000,
        },
        {
          command: `npm run start -- -p ${portalPort}`,
          env: {
            GATEWAY_URL: `http://localhost:${stubPort}`,
            AUTH_COOKIE_SECURE: "false",
          },
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
