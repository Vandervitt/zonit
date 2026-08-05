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
    // .tsx 一并收：组件测试要包 Provider 时用 JSX 比 createElement 可读得多
    // （createElement 传 children 会触发 react/no-children-prop）。
    include: [
      "lib/**/*.test.{ts,tsx}",
      "lib/**/__tests__/**/*.test.{ts,tsx}",
      "landing-editor/**/*.test.{ts,tsx}",
      "landing-renderer/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
    ],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
