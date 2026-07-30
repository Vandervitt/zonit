// landing-editor/lib/validate.anchor.test.ts
// 页内锚点链接：表单要能当主转化路径，CTA 就必须允许指向页内的留资表单。
// 放行范围严格限定在锚点本身——交易语义与非法格式的既有拦截一律不放松。
import { describe, it, expect } from "vitest";
import { validateLink } from "./validate";

describe("validateLink 页内锚点", () => {
  it("放行指向留资表单的锚点", () => {
    expect(validateLink("#lead-form")).toBeUndefined();
  });

  it("放行其它页内锚点（区块跳转）", () => {
    expect(validateLink("#pricing-section")).toBeUndefined();
  });

  it("孤立的 # 不算有效落点", () => {
    expect(validateLink("#")).toBeDefined();
  });

  it("锚点里带交易语义仍然拦截", () => {
    expect(validateLink("#checkout")).toBeDefined();
    expect(validateLink("#add-to-cart")).toBeDefined();
  });

  it("既有规则不受影响：合法 scheme 放行、非法格式仍拦", () => {
    expect(validateLink("https://wa.me/8613800138000")).toBeUndefined();
    expect(validateLink("mailto:sales@example.com")).toBeUndefined();
    expect(validateLink("javascript:alert(1)")).toBeDefined();
    expect(validateLink("wa.me/86138")).toBeDefined();
  });
});
