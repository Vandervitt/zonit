// app/robots.ts 的守卫测试。
//
// 存在的理由（2026-08-11 GSC 排查）：Search Console 显示 78 个页面长期停在
// 「已发现－尚未编入索引」且「上次抓取日期：不适用」（从未被抓取），而抓取
// 统计里 5,330 次请求 100% 返回 200、平均响应 168ms——抓得动，只是没轮到。
//
// 根因在抓取预算的分配：「按文件类型」其他文件类型占 75%（3,989 次）、HTML 仅 9%，
// 抽样全是 `?_rsc=<hash>` 的 RSC payload URL；「按目的」刷新 96% / 发现只有 4%。
// App Router 的 <Link> 预取会给每个页面派生一个带 `_rsc` 的孪生 URL，且该 hash 随
// 构建变化（见 node_modules/next/dist/docs/01-app/02-guides/cdn-caching.md：
// `_rsc` 是区分 HTML 与 RSC 响应变体的缓存键判别参数），于是每次部署再生一批新 URL，
// 把发现新页面的配额挤没了。
//
// `_rsc` 只服务客户端导航预取，Googlebot 抓 HTML 不需要它 ⇒ 屏蔽不影响渲染与索引。
// 这批断言锁死「两条分支都必须屏蔽 `_rsc`」——平台主域和租户自有域跑的是同一套
// App Router，租户域同样会被预取 URL 稀释抓取预算。
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://zapbridge.tech";
});

const mocks = vi.hoisted(() => ({
  host: "zapbridge.tech",
  publishedRoutes: [] as { path: string; noindex: boolean }[],
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: mocks.host }),
}));

vi.mock("@/lib/domains-db", () => ({
  listPublishedRoutes: async () => mocks.publishedRoutes,
}));

import robots from "./robots";
import { RSC_PREFETCH_DISALLOW } from "@/lib/seo/rsc";

/** 把 rules（对象或数组）拍平成 disallow 字符串数组，断言时不必关心形状。 */
function allDisallows(rules: Awaited<ReturnType<typeof robots>>["rules"]): string[] {
  const list = Array.isArray(rules) ? rules : [rules];
  return list.flatMap((r) => {
    const d = r.disallow;
    return d === undefined ? [] : Array.isArray(d) ? d : [d];
  });
}

beforeEach(() => {
  mocks.host = "zapbridge.tech";
  mocks.publishedRoutes = [];
});

describe("平台主域 robots", () => {
  it("屏蔽 RSC 预取 URL——每条 user-agent 规则都要屏蔽，漏一条就等于没屏蔽", async () => {
    const { rules } = await robots();
    const list = Array.isArray(rules) ? rules : [rules];

    expect(list.length).toBeGreaterThan(1); // 通用 + AI 爬虫两组
    for (const rule of list) {
      const d = rule.disallow;
      const disallow = d === undefined ? [] : Array.isArray(d) ? d : [d];
      expect(disallow).toContain(RSC_PREFETCH_DISALLOW);
    }
  });

  it("原有的后台与接口屏蔽不受影响", async () => {
    const disallow = allDisallows((await robots()).rules);
    expect(disallow).toContain("/admin");
    expect(disallow).toContain("/super-admin");
    expect(disallow).toContain("/api");
  });

  it("营销面仍然放行", async () => {
    const { rules } = await robots();
    const list = Array.isArray(rules) ? rules : [rules];
    expect(list.every((r) => r.allow === "/")).toBe(true);
  });
});

describe("租户自有域 robots", () => {
  it("有可收录页面时，同样屏蔽 RSC 预取 URL", async () => {
    mocks.host = "acme.com";
    mocks.publishedRoutes = [{ path: "/lp", noindex: false }];

    const result = await robots();
    expect(allDisallows(result.rules)).toContain(RSC_PREFETCH_DISALLOW);
    expect(result.sitemap).toBe("https://acme.com/sitemap.xml");
  });

  it("noindex 页面的路径与 RSC 屏蔽并存，不互相顶掉", async () => {
    mocks.host = "acme.com";
    mocks.publishedRoutes = [
      { path: "/lp", noindex: false },
      { path: "/secret", noindex: true },
    ];

    const disallow = allDisallows((await robots()).rules);
    expect(disallow).toContain("/secret");
    expect(disallow).toContain(RSC_PREFETCH_DISALLOW);
  });

  it("一张可收录页都没有时仍然禁整站——此时不必再单独屏蔽 RSC", async () => {
    mocks.host = "acme.com";
    mocks.publishedRoutes = [{ path: "/lp", noindex: true }];

    const { rules } = await robots();
    expect(Array.isArray(rules) ? rules[0].disallow : rules.disallow).toBe("/");
  });
});
