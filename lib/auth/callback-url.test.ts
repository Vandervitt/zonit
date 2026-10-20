// 登录回跳地址的契约：只接受站内路径，任何能跳出本站的写法一律拒绝（防开放重定向）。
import { describe, it, expect } from "vitest";
import { safeCallbackPath, postLoginTarget, withCallbackUrl, CALLBACK_PARAM } from "./callback-url";

describe("safeCallbackPath", () => {
  it.each([
    "/admin",
    "/admin/landing-pages?template=b2b-sourcing",
    "/super-admin/users?q=a%20b",
    "/admin/editor/abc#section",
  ])("站内路径 %s 原样接受", (path) => {
    expect(safeCallbackPath(path)).toBe(path);
  });

  it.each([
    ["协议相对地址", "//evil.com/admin"],
    ["反斜杠绕过", "/\\evil.com"],
    ["绝对地址", "https://evil.com/admin"],
    ["javascript 伪协议", "javascript:alert(1)"],
    ["相对路径", "admin"],
    ["空串", ""],
    ["含换行", "/admin\n//evil.com"],
  ])("拒绝%s：%s", (_label, raw) => {
    expect(safeCallbackPath(raw)).toBeNull();
  });

  it("null / undefined 返回 null", () => {
    expect(safeCallbackPath(null)).toBeNull();
    expect(safeCallbackPath(undefined)).toBeNull();
  });
});

describe("postLoginTarget", () => {
  it("合法回跳优先", () => {
    expect(postLoginTarget("/admin/landing-pages?template=pet")).toBe("/admin/landing-pages?template=pet");
  });

  it("缺失或非法时回落后台首页，而不是营销首页", () => {
    expect(postLoginTarget(null)).toBe("/admin");
    expect(postLoginTarget("//evil.com")).toBe("/admin");
  });
});

describe("withCallbackUrl", () => {
  it("有合法回跳时带上编码后的参数", () => {
    expect(withCallbackUrl("/zh/register", "/admin/landing-pages?template=pet")).toBe(
      `/zh/register?${CALLBACK_PARAM}=%2Fadmin%2Flanding-pages%3Ftemplate%3Dpet`,
    );
  });

  it("无回跳或非法回跳时返回原路径", () => {
    expect(withCallbackUrl("/login", null)).toBe("/login");
    expect(withCallbackUrl("/login", "//evil.com")).toBe("/login");
  });
});
