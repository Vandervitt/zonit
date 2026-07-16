import { describe, it, expect } from "vitest";
import { resolveActiveNavKey } from "./nav";

describe("resolveActiveNavKey（侧边栏当前页高亮）", () => {
  it("概览仅在 /admin 精确命中", () => {
    expect(resolveActiveNavKey("/admin")).toBe("overview");
  });

  // 回归：/admin 前缀会命中所有子路由，旧逻辑取首个匹配导致每页都高亮概览
  it.each([
    ["/admin/landing-pages", "pages"],
    ["/admin/leads", "leads"],
    ["/admin/domains", "domains"],
    ["/admin/media", "media"],
    ["/admin/analytics", "analytics"],
    ["/admin/billing", "billing"],
    ["/admin/settings", "settings"],
    ["/admin/help", "help"],
  ])("%s → %s（不再错误高亮概览）", (pathname, key) => {
    expect(resolveActiveNavKey(pathname)).toBe(key);
  });

  it("子路由（如落地页下的编辑深层路径）高亮对应父项", () => {
    expect(resolveActiveNavKey("/admin/landing-pages/anything")).toBe("pages");
  });

  it("非导航路由回落 overview", () => {
    expect(resolveActiveNavKey("/admin/editor/abc")).toBe("overview");
  });
});
