// app/sitemap.ts 的守卫测试。
//
// 存在的理由（2026-08-07 生产事故）：平台主域分支曾用请求 host 派生 base，
// 而 canonical 走 lib/seo/site.ts 的 SITE_URL 常量。两者来源不同 ⇒ 一旦
// Vercel 域名配置把 www 设成主域，sitemap 输出 https://www.zapbridge.tech/…
// 而页面 canonical 仍声明 https://zapbridge.tech ⇒ 规范化死结：
// 爬虫读 sitemap 拿到 www，抓 www 页面被告知 canonical 是 apex，抓 apex 又被
// 308 弹回 www。这批断言锁死「平台 sitemap 的 host 不随请求 host 变化」。
//
// 租户分支必须保持相反行为——它的 base 就该跟着请求 host 走，因为每个客户
// 域名要出自己的 sitemap。两条断言是一组，改一边必须看另一边。
import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/host.ts 与 lib/seo/site.ts 都在模块加载时读 env，必须在 import 之前落定。
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://zapbridge.tech";
});

const mocks = vi.hoisted(() => ({
  host: "zapbridge.tech",
  publishedRoutes: [] as { path: string; noindex: boolean; updated_at: string | null }[],
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: mocks.host }),
}));

vi.mock("@/lib/domains-db", () => ({
  listPublishedRoutes: async () => mocks.publishedRoutes,
}));

import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/seo/site";

beforeEach(() => {
  mocks.host = "zapbridge.tech";
  mocks.publishedRoutes = [];
});

describe("平台主域 sitemap 的 host", () => {
  it("从 www 抓取时，输出的仍是 SITE_URL 的 host——不跟着请求 host 漂移", async () => {
    mocks.host = "www.zapbridge.tech";
    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.url.startsWith(`${SITE_URL}/`), e.url).toBe(true);
    }
  });

  it("hreflang alternates 同样锁在 SITE_URL 上", async () => {
    mocks.host = "www.zapbridge.tech";
    const entries = await sitemap();

    const withAlternates = entries.filter((e) => e.alternates?.languages);
    expect(withAlternates.length).toBeGreaterThan(0);
    for (const e of withAlternates) {
      for (const href of Object.values(e.alternates!.languages!)) {
        expect(
          String(href).startsWith(`${SITE_URL}/`),
          `${e.url} → ${String(href)}`,
        ).toBe(true);
      }
    }
  });

  it("从 apex 抓取时结果与从 www 抓取完全一致", async () => {
    mocks.host = "zapbridge.tech";
    const fromApex = (await sitemap()).map((e) => e.url);
    mocks.host = "www.zapbridge.tech";
    const fromWww = (await sitemap()).map((e) => e.url);

    expect(fromWww).toEqual(fromApex);
  });
});

describe("租户域 sitemap 的 host", () => {
  it("仍跟着请求 host 走——每个客户域名出自己的 sitemap", async () => {
    mocks.host = "acme-clinic.com";
    mocks.publishedRoutes = [
      { path: "/", noindex: false, updated_at: null },
      { path: "/invisalign", noindex: false, updated_at: null },
    ];
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toEqual(["https://acme-clinic.com/", "https://acme-clinic.com/invisalign"]);
  });

  it("noindex 的页不进 sitemap", async () => {
    mocks.host = "acme-clinic.com";
    mocks.publishedRoutes = [
      { path: "/", noindex: false, updated_at: null },
      { path: "/hidden", noindex: true, updated_at: null },
    ];
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toEqual(["https://acme-clinic.com/"]);
  });
});
