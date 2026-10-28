// 租户域名改写边界：访客公开 API 不得被改写成落地页 HTML。
// 回归背景：自定义域名下 LeadForm 相对路径 POST /api/leads 被整体改写到
// /p/{slug}，返回 200 HTML，线索静默丢失（客户端 res.ok 误判成功）。
import { describe, it, expect, vi, beforeAll } from "vitest";

// proxy 不再查库：「这个路径发布了哪张页」改由 app/p/page.tsx 解析
// （规则与用例见 lib/landing-pages/tenant-target.test.ts）。这里只验证改写边界。
// 一旦 proxy 重新碰库，这个 mock 会让对应用例立即失败。
vi.mock("@/lib/domains-db", () => ({
  resolveTenantRoute: vi.fn(() => {
    throw new Error("proxy 不得查库：欧美访客每次跨区查新加坡库 1.1–1.6 秒");
  }),
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
const tenantPath = (res: Response | null) =>
  res?.headers.get("x-middleware-request-x-tenant-path") ?? null;
const tenantHost = (res: Response | null) =>
  res?.headers.get("x-middleware-request-x-tenant-host") ?? null;
/** 改写到落地页入口 /p（不是 /p/xxx），并透传域名与路径。 */
const expectTenantRewrite = (res: Response | null, host: string, path: string) => {
  expect(rewriteTarget(res)).toMatch(/\/p$/);
  expect(tenantHost(res)).toBe(host);
  expect(tenantPath(res)).toBe(path);
};

describe("handleTenancy 租户改写既有行为", () => {
  it("自定义域名根路径 → 改写到 /p 并透传域名与路径", async () => {
    expectTenantRewrite(await handleTenancy(makeReq("tenant.example", "/")), "tenant.example", "/");
  });

  // 绑定与否由页面判定（未绑定 → 页面 notFound()），proxy 不再为此查库。
  it("未绑定页面的自定义域名同样改写，由页面返回 404", async () => {
    expectTenantRewrite(await handleTenancy(makeReq("unbound.example", "/")), "unbound.example", "/");
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

// 政策子页：四家平台都会点开落地页的隐私政策与条款，故它必须是真地址而非页脚文本。
// 它挂在哪张页下由页面解析；proxy 只需原样透传访客路径。
describe("handleTenancy 政策子页", () => {
  it.each(["/privacy", "/terms", "/invisalign/privacy", "/invisalign/terms"])(
    "%s 原样透传给页面解析",
    async (pathname) => {
      expectTenantRewrite(await handleTenancy(makeReq("tenant.example", pathname)), "tenant.example", pathname);
    },
  );
});

describe("handleTenancy 多路径解析", () => {
  it("子路径透传原路径（页面据此解析该渲染哪张页）", async () => {
    expectTenantRewrite(
      await handleTenancy(makeReq("tenant.example", "/invisalign")),
      "tenant.example",
      "/invisalign",
    );
  });

  // 透传的是规范化后的路径：页面按它查 domain_routes，与发布时写入的口径一致。
  it.each(["/Invisalign", "/invisalign/", "//invisalign"])(
    "%s 规范化为 /invisalign 后透传",
    async (pathname) => {
      expectTenantRewrite(await handleTenancy(makeReq("tenant.example", pathname)), "tenant.example", "/invisalign");
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
    expectTenantRewrite(await handleTenancy(makeReq("tenant.example", pathname)), "tenant.example", "/");
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

// 回归：生产 cron 从未跑成功过（2026-06-26 上线 ~ 2026-07-31 发现）。
//
// Vercel 触发 cron 时用的是**部署 URL**（project-xxx.vercel.app），不是
// NEXT_PUBLIC_APP_URL 里的品牌域名。isCustomDomain() 因此把它判成租户域名，
// handleTenancy 在「该 host 没有绑定落地页」分支直接 404，请求根本进不到路由。
// 表现：Vercel 面板里 GET /api/cron/daily 显示 Middleware 404，而同一路由
// 在 zapbridge.tech 上访问是 401（路由自身鉴权）——差别只在 Host。
//
// 后果是整条 daily 编排器五周内一次没跑：线索兜底重投、CAPI / webhook 兜底重发、
// 未读线索提醒、限频清理、周报，全部静默停摆。
describe("handleTenancy 平台自有 host 不得被当成租户域名（回归：生产 cron 被 404）", () => {
  it.each([
    "/api/cron/daily",
    "/api/cron/capi-flush",
    "/api/cron/webhook-flush",
  ])("Vercel 部署 URL 上的 %s 必须放行到路由", async (pathname) => {
    const res = await handleTenancy(
      makeReq("project-36oi3-abc123-team.vercel.app", pathname),
    );
    expect(res).toBeNull();
  });

  it("部署 URL 上的普通页面也不按租户改写（整个 app 都该正常）", async () => {
    expect(await handleTenancy(makeReq("project-36oi3-abc123-team.vercel.app", "/pricing"))).toBeNull();
    expect(await handleTenancy(makeReq("my-app.vercel.app", "/"))).toBeNull();
  });

  // cron 路由自身用 CRON_SECRET 鉴权，故即使从租户域名进来也安全放行；
  // 这层是纵深防御：Vercel 日后再改触发 host 也不会重演本次故障。
  it("租户域名上的 /api/cron/* 同样放行（路由自身鉴权）", async () => {
    expect(await handleTenancy(makeReq("tenant.example", "/api/cron/daily"))).toBeNull();
  });

  it("但租户域名上的其余 /api 仍收敛为 404，暴露面不扩大", async () => {
    const res = await handleTenancy(makeReq("tenant.example", "/api/landing-pages"));
    expect(res?.status).toBe(404);
  });
});

describe("子域池 apex 重定向", () => {
  // apex（如 zapbridge.site）是平台分配子域的根，不属于任何用户。
  // 它历史上曾被当作客户自有域名绑过样例页——若不拦截，访客访问根域会看到
  // 一张护肤模板样例，误以为这是某个品牌的独立站。
  let tenancy: Tenancy["handleTenancy"];

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
    vi.stubEnv("PLATFORM_SUBDOMAIN_ROOT", "pool.example");
    vi.resetModules();
    ({ handleTenancy: tenancy } = await import("./tenant-proxy"));
  });

  it("apex → 308 重定向到平台主域", async () => {
    const res = await tenancy(makeReq("pool.example", "/"));
    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toBe("https://app.example.com/");
  });

  it("apex 的任意路径都重定向，不落到租户 404", async () => {
    const res = await tenancy(makeReq("pool.example", "/anything"));
    expect(res?.status).toBe(308);
  });

  it("子域不受影响：仍按租户域改写", async () => {
    expectTenantRewrite(await tenancy(makeReq("acme.pool.example", "/")), "acme.pool.example", "/");
  });

  it("仿冒 apex 的域名不被重定向，按普通租户域处理", async () => {
    expectTenantRewrite(await tenancy(makeReq("evilpool.example", "/")), "evilpool.example", "/");
  });
});

describe("遗留子域根", () => {
  // 品牌更名后旧根不再分配新子域，但存量子域仍在客户广告里跑，必须继续解析；
  // 与此同时旧 apex 依然不该露出。
  let tenancy: Tenancy["handleTenancy"];

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
    vi.stubEnv("PLATFORM_SUBDOMAIN_ROOT", "new.example");
    vi.stubEnv("PLATFORM_SUBDOMAIN_LEGACY_ROOTS", "old.example,older.example");
    vi.resetModules();
    ({ handleTenancy: tenancy } = await import("./tenant-proxy"));
  });

  it("遗留根的 apex 也重定向到平台主域", async () => {
    const res = await tenancy(makeReq("old.example", "/"));
    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toBe("https://app.example.com/");
  });

  it("逗号分隔的第二个遗留根同样生效", async () => {
    expect((await tenancy(makeReq("older.example", "/")))?.status).toBe(308);
  });

  it("当前根不受影响，仍然重定向", async () => {
    expect((await tenancy(makeReq("new.example", "/")))?.status).toBe(308);
  });

  it("遗留根的子域继续按租户域解析 —— 存量发布页不能被打死", async () => {
    expectTenantRewrite(await tenancy(makeReq("acme.old.example", "/")), "acme.old.example", "/"); // 关键是没被 308 掉
  });
});

// 回归：2026-09-01 生产走查发现 zapbridge.xyz/meizhuan 被 308 到营销首页。
//
// 硬编码的 BRAND_LEGACY_ROOTS 里混进了两个**不属于平台**的域名。这里的判断是
// 纯 hostname 精确匹配、且发生在租户解析**之前**，所以后果不是「apex 不露出」，
// 而是该域名下**每一条已发布路径**都打不开——而后台照旧显示「已验证 / 已发布」，
// 故障完全静默。这组用例锁住「租户自有域名不得被当成平台根」。
describe("租户自有域名不得被误判为平台根（回归：整域被 308）", () => {
  let tenancy: Tenancy["handleTenancy"];

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
    vi.stubEnv("PLATFORM_SUBDOMAIN_ROOT", "new.example");
    vi.stubEnv("PLATFORM_SUBDOMAIN_LEGACY_ROOTS", "");
    vi.resetModules();
    ({ handleTenancy: tenancy } = await import("./tenant-proxy"));
  });

  it.each(["zapbridge.xyz", "zapbridge.com"])("%s 不被 308，走租户解析", async (host) => {
    const res = await tenancy(makeReq(host, "/meizhuan"));
    expect(res?.status).not.toBe(308);
  });

  it("平台自己的旧根 zapbridge.tech 仍然重定向", async () => {
    const res = await tenancy(makeReq("zapbridge.tech", "/"));
    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toBe("https://app.example.com/");
  });
});
