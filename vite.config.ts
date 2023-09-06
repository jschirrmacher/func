import { defineConfig } from "vitest/config"

export default defineConfig({
  build: {
    outDir: "dist",
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  test: {
    includeSource: ["**/*.ts"],
    coverage: {
      provider: "v8",
      all: true,
      exclude: ["**/*.test.ts"],
      reporter: ["html", "json-summary", "json"],
      // lines: 65,
      // branches: 80,
      // functions: 65,
      // statements: 65,
    },
  },
})
