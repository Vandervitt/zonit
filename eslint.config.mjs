import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "test-results/**",
    "next-env.d.ts",
    "test-db.js",
    "test-proxy.js",
  ]),
  // UI 一致性护栏：品牌色单一源 + 禁止引入第三套 UI 库。
  // 令牌唯一源见 styles/theme.css；TS 侧常量见 lib/theme/brand.ts。
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["lib/theme/brand.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#0e9fe4/i]",
          message:
            "品牌主色请从 @/lib/theme/brand 导入 BRAND，勿硬编码 #0e9fe4（令牌单一源见 styles/theme.css）。",
        },
        {
          selector: "TemplateElement[value.raw=/#0e9fe4/i]",
          message:
            "品牌主色请从 @/lib/theme/brand 导入 BRAND，勿硬编码 #0e9fe4（令牌单一源见 styles/theme.css）。",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@mui/*", "@emotion/*"],
              message:
                "本项目 UI 仅用 shadcn/ui（前台）与 Ant Design（后台），勿引入 MUI/emotion。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
