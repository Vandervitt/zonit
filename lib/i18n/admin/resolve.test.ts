import { describe, it, expect } from "vitest";
import { resolveAdminLocale } from "./resolve";

describe("resolveAdminLocale（后台语言解析优先级）", () => {
  it("用户显式选择优先于注册来源 cookie", () => {
    expect(resolveAdminLocale("en", "zh")).toBe("en");
    expect(resolveAdminLocale("zh", "en")).toBe("zh");
  });

  // 新用户 users.locale 为 NULL：刚注册完浏览器还带着营销站的语言，
  // 用它兜底比直接落到 defaultLocale 更贴近用户预期。
  it("用户未表态时跟随注册来源 cookie", () => {
    expect(resolveAdminLocale(null, "zh")).toBe("zh");
    expect(resolveAdminLocale(undefined, "en")).toBe("en");
  });

  it("两者都没有时落到默认语言 en", () => {
    expect(resolveAdminLocale(null, null)).toBe("en");
  });

  // 这一列会被注册路径、设置页 API、人工改库等多处写入，脏值不该让后台打不开。
  it("脏值按未设置处理，逐级回退而非抛错", () => {
    expect(resolveAdminLocale("ja", "zh")).toBe("zh");
    expect(resolveAdminLocale("", "zh")).toBe("zh");
    expect(resolveAdminLocale("zh-CN", null)).toBe("en");
    expect(resolveAdminLocale("ja", "ko")).toBe("en");
  });
});
