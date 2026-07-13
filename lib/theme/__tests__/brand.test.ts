import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BRAND } from "../brand";

/**
 * 令牌单一源护栏：TS 侧的 BRAND 必须与 styles/theme.css 的 :root --primary 严格一致。
 * 任一侧改色而另一侧忘改，此测试即失败，避免前台(shadcn) / 后台(antd) 品牌色漂移。
 */
describe("brand token 一致性", () => {
  it("BRAND === styles/theme.css 的 :root --primary", () => {
    const cssPath = fileURLToPath(new URL("../../../styles/theme.css", import.meta.url));
    const css = readFileSync(cssPath, "utf8");

    // 只取 :root 块（第一个 { ... }），避免命中 .dark 的 --primary。
    const rootBlock = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
    const match = rootBlock.match(/--primary:\s*([^;]+);/);

    expect(match, ":root 中未找到 --primary").not.toBeNull();
    expect(match![1].trim().toLowerCase()).toBe(BRAND.toLowerCase());
  });
});
