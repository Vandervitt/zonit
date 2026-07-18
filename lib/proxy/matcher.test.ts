import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// 直接从 proxy.ts 源码提取真实的 matcher 正则，作为单一事实源做守卫，
// 避免测试与实际中间件配置漂移。
function loadMatcherPattern(): string {
  const src = readFileSync(
    fileURLToPath(new URL("../../proxy.ts", import.meta.url)),
    "utf8",
  );
  const m = src.match(/matcher:\s*\[\s*"([^"]+)"/);
  if (!m) throw new Error("未能从 proxy.ts 解析出 matcher 正则");
  return m[1];
}

const matches = (pathname: string) =>
  new RegExp(`^${loadMatcherPattern()}$`).test(pathname);

describe("proxy 中间件 matcher", () => {
  it("放行约定式品牌图标 /icon.svg（回归：避免匿名访客被鉴权重定向到 /login）", () => {
    expect(matches("/icon.svg")).toBe(false);
  });

  it("放行 favicon.ico 与 Next 静态资源", () => {
    expect(matches("/favicon.ico")).toBe(false);
    expect(matches("/_next/static/chunk.js")).toBe(false);
    expect(matches("/_next/image")).toBe(false);
  });

  it("仍拦截需鉴权的页面与 API", () => {
    expect(matches("/admin")).toBe(true);
    expect(matches("/super-admin")).toBe(true);
    expect(matches("/api/leads")).toBe(true);
    expect(matches("/login")).toBe(true);
  });
});
