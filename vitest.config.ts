import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    includeSource: ["**/*.ts"],
    globalSetup: ["test-setup.ts"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["src"],
      exclude: ["**/*.test.ts"],
      reporter: ["html", "json-summary", "json"],
      lines: 65,
      branches: 80,
      functions: 65,
      statements: 65,
    },
  },
})
