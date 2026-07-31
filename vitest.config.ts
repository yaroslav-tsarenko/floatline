import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    env: {
      // Unit tests exercise pure logic; skip env validation so importing
      // modules that read `env` doesn't require real secrets.
      SKIP_ENV_VALIDATION: "true",
    },
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
