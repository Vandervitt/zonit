import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "lib/**/*.test.ts",
      "lib/**/__tests__/**/*.test.ts",
      "landing-editor/**/*.test.ts",
      "landing-renderer/**/*.test.ts",
      "app/**/*.test.ts",
    ],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
