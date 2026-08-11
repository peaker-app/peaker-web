import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./src/test/serverOnlyStub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/types/**",
        "src/i18n/**",
        "src/app/**/layout.tsx",
        "src/app/**/page.tsx",
        "src/app/global-error.tsx",
        // Motivo: primitivos de shadcn/ui copiados sin lógica propia. Se auditan
        // por revisión, no por test unitario (FRONTEND.md §1.1).
        "src/components/ui/**",
        // Motivo: jsdom no renderiza Leaflet, que necesita medidas reales de layout.
        // La integración del mapa se cubre en los e2e de Playwright.
        "src/components/features/peaks/PeakMapView.tsx",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
