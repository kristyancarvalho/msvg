import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/main.ts"],
      thresholds: {
        statements: 70,
        branches: 55,
        functions: 70,
        lines: 70,
      },
    },
  },
});
