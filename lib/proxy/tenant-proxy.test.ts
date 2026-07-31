// 租户域名改写边界：访客公开 API 不得被改写成落地页 HTML。
// 回归背景：自定义域名下 LeadForm 相对路径 POST /api/leads 被整体改写到
// /p/{slug}，返回 200 HTML，线索静默丢失（客户端 res.ok 误判成功）。
import { describe, it, expect, vi, beforeAll } from "vitest";

// 解析依据是 domain_routes（域名 + 路径）。模拟一个域名下发布了两张页：
// 根路径与 /invisalign，其余路径无绑定。
const ROUTES: Record<string, string> = {
  "/": "solar-page",
  "/invisalign": "dental-page",
};
vi.mock("@/lib/domains-db", () => ({
  resolveTenantRoute: vi.fn(async (domain: string, path: string) =>
    domain === "tenant.example" ? (ROUTES[path] ?? null) : null,
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

describe("handleTenancy 多路径解析", () => {
  it("根路径 → 根页", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/"));
    expect(rewriteTarget(res)).toContain("/p/solar-page");
  });

  it("已发布子路径 → 对应页（不是根页）", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/invisalign"));
    expect(rewriteTarget(res)).toContain("/p/dental-page");
  });

  it("透传原始路径供 canonical 使用", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/invisalign"));
    // 改写后下游 pathname 变成 /p/{slug}，canonical 只能靠这个头还原真实地址。
    expect(res?.headers.get("x-middleware-request-x-tenant-path")).toBe("/invisalign");
  });

  it.each(["/Invisalign", "/invisalign/", "//invisalign"])(
    "%s 经规范化命中同一条 route",
    async (pathname) => {
      const res = await handleTenancy(makeReq("tenant.example", pathname));
      expect(rewriteTarget(res)).toContain("/p/dental-page");
    },
  );

  // 未绑定路径必须 404，不得 fallback 到根页（设计决策 D6）：
  // 静默 fallback 会让每个错误路径都变成一份重复内容，正是 PR #136 修掉的问题。
  it.each(["/pricing", "/asdf", "/whitening"])(
    "未绑定路径 %s → 404，不回落到根页",
    async (pathname) => {
      const res = await handleTenancy(makeReq("tenant.example", pathname));
      expect(res?.status).toBe(404);
      expect(rewriteTarget(res)).toBeNull();
    },
  );

  // 形状不合法者连库都不查，直接 404。
  it.each(["/a/b/c", "/index.html", "/a b", "/a_b"])(
    "形状不合法 %s → 404",
    async (pathname) => {
      expect((await handleTenancy(makeReq("tenant.example", pathname)))?.status).toBe(404);
    },
  );

  // 保留路径即使库里存在绑定也不得遮蔽平台自有路由。
  it("保留路径 /api/landing-pages → 404（不进入租户解析）", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/api/landing-pages"));
    expect(res?.status).toBe(404);
    expect(rewriteTarget(res)).toBeNull();
  });

  it.each(["//", "///"])("%s 折叠为根路径并正常改写", async (pathname) => {
    const res = await handleTenancy(makeReq("tenant.example", pathname));
    expect(rewriteTarget(res)).toContain("/p/solar-page");
  });

  it("公开 API 与 /_next 的放行优先于路径解析", async () => {
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
