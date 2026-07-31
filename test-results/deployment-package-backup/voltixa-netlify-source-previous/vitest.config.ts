import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", "node_modules_incomplete*/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
