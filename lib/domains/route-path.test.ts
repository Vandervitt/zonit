// 规范化规则必须与 migrations/036 的 domain_routes_path_shape CHECK 约束一致：
// 任何被此函数接受的路径，都要能写进库；任何被库拒绝的形态，这里也要拒绝。
import { describe, it, expect } from "vitest";
import { normalizeRoutePath, ROOT_PATH } from "./route-path";

describe("normalizeRoutePath 规范化", () => {
  it("根路径原样返回", () => {
    expect(normalizeRoutePath("/")).toBe(ROOT_PATH);
  });

  it.each([
    ["/services", "/services"],
    ["/Services", "/services"],
    ["/SERVICES", "/services"],
    ["/services/", "/services"],
    ["services", "/services"],
    ["//services", "/services"],
    ["/clear-aligners", "/clear-aligners"],
    ["/a/b", "/a/b"],
    ["/A/B/", "/a/b"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeRoutePath(input)).toBe(expected);
  });

  it.each([
    ["", "空串"],
    ["/a/b/c", "超过 2 段"],
    ["/a b", "含空格"],
    ["/a_b", "含下划线"],
    ["/a.b", "含点"],
    ["/中文", "非 ASCII"],
    ["/a%20b", "百分号编码"],
  ])("拒绝 %s（%s）", (input) => {
    expect(normalizeRoutePath(input)).toBeNull();
  });

  // 访客输入 brand.com// 应看到落地页而非 404，故重复斜杠折叠到根而不是判非法。
  it.each(["//", "///"])("%s 折叠为根路径", (input) => {
    expect(normalizeRoutePath(input)).toBe(ROOT_PATH);
  });

  it("幂等：规范化结果再规范化不变", () => {
    for (const p of ["/", "/services", "/a/b"]) {
      expect(normalizeRoutePath(normalizeRoutePath(p)!)).toBe(p);
    }
  });
});
