// 客户域名路径 → 渲染目标。原在 proxy 里的解析规则（含政策子页回退顺序）挪到这里后，
// 用例随之从 lib/proxy/tenant-proxy.test.ts 迁来。
import { describe, it, expect, vi } from "vitest";

// 模拟一个域名下发布了两张页：根路径与 /invisalign，其余路径无绑定。
const ROUTES: Record<string, string> = {
  "/": "solar-page",
  "/invisalign": "dental-page",
};
const resolveTenantRouteCached = vi.fn(async (domain: string, path: string) =>
  domain === "tenant.example" ? (ROUTES[path] ?? null) : null,
);
vi.mock("./published-cache", () => ({
  resolveTenantRouteCached: (domain: string, path: string) => resolveTenantRouteCached(domain, path),
}));

const { resolveTenantTarget } = await import("./tenant-target");

describe("resolveTenantTarget 多路径解析", () => {
  it("根路径 → 根页", async () => {
    await expect(resolveTenantTarget("tenant.example", "/")).resolves.toEqual({
      slug: "solar-page",
      kind: "landing",
      landingPath: "/",
    });
  });

  it("已发布子路径 → 对应页（不是根页）", async () => {
    await expect(resolveTenantTarget("tenant.example", "/invisalign")).resolves.toEqual({
      slug: "dental-page",
      kind: "landing",
      landingPath: "/invisalign",
    });
  });

  // 未绑定路径必须 404，不得 fallback 到根页（设计决策 D6）：
  // 静默 fallback 会让每个错误路径都变成一份重复内容，正是 PR #136 修掉的问题。
  it.each(["/pricing", "/asdf", "/whitening"])("未绑定路径 %s → null，不回落到根页", async (path) => {
    await expect(resolveTenantTarget("tenant.example", path)).resolves.toBeNull();
  });

  it("未绑定的域名 → null", async () => {
    await expect(resolveTenantTarget("unbound.example", "/")).resolves.toBeNull();
  });
});

describe("resolveTenantTarget 政策子页", () => {
  it.each([
    ["/privacy", "solar-page", "privacy", "/"],
    ["/terms", "solar-page", "terms", "/"],
    ["/invisalign/privacy", "dental-page", "privacy", "/invisalign"],
    ["/invisalign/terms", "dental-page", "terms", "/invisalign"],
  ])("%s → %s 的 %s 页，落地页路径 %s", async (path, slug, kind, landingPath) => {
    await expect(resolveTenantTarget("tenant.example", path)).resolves.toEqual({ slug, kind, landingPath });
  });

  it("所挂落地页未发布 → null", async () => {
    await expect(resolveTenantTarget("tenant.example", "/whitening/privacy")).resolves.toBeNull();
  });

  it("精确绑定优先于政策子页回退", async () => {
    ROUTES["/privacy"] = "privacy-landing";
    try {
      await expect(resolveTenantTarget("tenant.example", "/privacy")).resolves.toEqual({
        slug: "privacy-landing",
        kind: "landing",
        landingPath: "/privacy",
      });
    } finally {
      delete ROUTES["/privacy"];
    }
  });

  it("形近路径不被当成政策页", async () => {
    await expect(resolveTenantTarget("tenant.example", "/privacy-policy")).resolves.toBeNull();
  });
});
