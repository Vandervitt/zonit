// 租户域名改写边界：访客公开 API 不得被改写成落地页 HTML。
// 回归背景：自定义域名下 LeadForm 相对路径 POST /api/leads 被整体改写到
// /p/{slug}，返回 200 HTML，线索静默丢失（客户端 res.ok 误判成功）。
import { describe, it, expect, vi, beforeAll } from "vitest";

// 解析依据已换成 domain_routes（域名 + 路径）。P1 仅根路径有绑定。
vi.mock("@/lib/domains-db", () => ({
  resolveTenantRoute: vi.fn(async (domain: string, path: string) =>
    domain === "tenant.example" && path === "/" ? "solar-page" : null,
  ),
}));

type Tenancy = typeof import("./tenant-proxy");
let handleTenancy: Tenancy["handleTenancy"];

beforeAll(async () => {
  // appHostname 在 lib/host 模块加载时从环境读取，须先固定再导入被测模块。
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
  vi.resetModules();
  ({ handleTenancy } = await import("./tenant-proxy"));
});

function makeReq(host: string, pathname: string, method = "GET") {
  return {
    headers: new Headers({ host }),
    nextUrl: { pathname },
    url: `https://${host}${pathname}`,
    method,
  } as unknown as Parameters<typeof handleTenancy>[0];
}

const rewriteTarget = (res: Response | null) =>
  res?.headers.get("x-middleware-rewrite") ?? null;

describe("handleTenancy 租户改写既有行为", () => {
  it("自定义域名根路径 → 改写到 /p/{slug}", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/"));
    expect(rewriteTarget(res)).toContain("/p/solar-page");
  });

  it("未绑定页面的自定义域名 → 404", async () => {
    const res = await handleTenancy(makeReq("unbound.example", "/"));
    expect(res?.status).toBe(404);
  });

  it("app 域名不改写", async () => {
    expect(await handleTenancy(makeReq("app.example.com", "/"))).toBeNull();
  });

  it("/_next 内部资源不改写", async () => {
    expect(
      await handleTenancy(makeReq("tenant.example", "/_next/static/x.js")),
    ).toBeNull();
  });
});

// 回归背景：改写只用 host 查 slug，pathname 未参与 URL 构造，导致租户域名下
// 任意路径都返回同一张落地页 HTML 200（soft-404），对搜索引擎是无限重复内容。
// 「一域名一页」的语义是根路径提供页面，其余路径本就不存在，应为 404。
describe("handleTenancy 非根路径不提供落地页（回归：soft-404 重复内容）", () => {
  it.each(["/pricing", "/asdf", "/a/b/c", "/index.html"])(
    "自定义域名 %s → 404，不返回落地页",
    async (pathname) => {
      const res = await handleTenancy(makeReq("tenant.example", pathname));
      expect(res?.status).toBe(404);
      expect(rewriteTarget(res)).toBeNull();
    },
  );

  it("根路径不受影响，仍改写到 /p/{slug}", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/"));
    expect(rewriteTarget(res)).toContain("/p/solar-page");
  });

  // P1 引入路径规范化后的唯一行为变化：重复斜杠折叠到根而非 404，
  // 访客输入 brand.com// 时看到落地页而不是错误页。
  it.each(["//", "///"])("%s 折叠为根路径并正常改写", async (pathname) => {
    const res = await handleTenancy(makeReq("tenant.example", pathname));
    expect(rewriteTarget(res)).toContain("/p/solar-page");
  });

  // 大小写与尾斜杠在 P1 仍是 404（多路径未开放），但走的是规范化后的比较，
  // 而非原始 pathname —— P2 开放多路径时这些应命中同一条 route。
  it.each(["/Services", "/services/"])("%s 在 P1 仍 404", async (pathname) => {
    expect((await handleTenancy(makeReq("tenant.example", pathname)))?.status).toBe(404);
  });

  it("公开 API 与 /_next 的放行优先于路径收敛", async () => {
    expect(
      await handleTenancy(makeReq("tenant.example", "/api/leads", "POST")),
    ).toBeNull();
    expect(
      await handleTenancy(makeReq("tenant.example", "/_next/static/x.js")),
    ).toBeNull();
  });

  it("robots/sitemap/llms 等元数据路由仍由各自路由处理", async () => {
    for (const p of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
      expect(await handleTenancy(makeReq("tenant.example", p))).toBeNull();
    }
  });
});

describe("handleTenancy 放行访客公开 API（回归：留资静默丢失）", () => {
  it("自定义域名 POST /api/leads 放行到路由（不改写成落地页）", async () => {
    expect(
      await handleTenancy(makeReq("tenant.example", "/api/leads", "POST")),
    ).toBeNull();
  });

  it("自定义域名 OPTIONS /api/leads 预检放行", async () => {
    expect(
      await handleTenancy(makeReq("tenant.example", "/api/leads", "OPTIONS")),
    ).toBeNull();
  });

  it("自定义域名 POST /api/track 放行", async () => {
    expect(
      await handleTenancy(makeReq("tenant.example", "/api/track", "POST")),
    ).toBeNull();
  });

  it("未绑定页面的自定义域名 POST /api/leads 亦放行（由路由自行校验 pageId）", async () => {
    expect(
      await handleTenancy(makeReq("unbound.example", "/api/leads", "POST")),
    ).toBeNull();
  });

  // 意图仍是「暴露面保持最小」：租户域名不得触达平台内部 API。
  // 实现从「改写成落地页」收敛为「404」——后者更直接，且不再产生
  // /api/* 返回落地页 HTML 200 这种既怪异又利于爬虫抓取的响应。
  it("其余 /api 路径不放行，按非根路径收敛为 404（面保持最小）", async () => {
    const res = await handleTenancy(
      makeReq("tenant.example", "/api/landing-pages"),
    );
    expect(res?.status).toBe(404);
    expect(rewriteTarget(res)).toBeNull();
  });
});
