// 租户域名改写边界：访客公开 API 不得被改写成落地页 HTML。
// 回归背景：自定义域名下 LeadForm 相对路径 POST /api/leads 被整体改写到
// /p/{slug}，返回 200 HTML，线索静默丢失（客户端 res.ok 误判成功）。
import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/domains-db", () => ({
  getLandingSlugByCustomDomain: vi.fn(async (domain: string) =>
    domain === "tenant.example" ? "solar-page" : null,
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

  it("其余 /api 路径不放行，仍走租户改写（面保持最小）", async () => {
    const res = await handleTenancy(
      makeReq("tenant.example", "/api/landing-pages"),
    );
    expect(rewriteTarget(res)).toContain("/p/solar-page");
  });
});
