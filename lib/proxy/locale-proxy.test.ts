// 首页按 IP 分流语言的边界。核心风险不在「大陆跳中文」本身，而在别把
// 爬虫、客户端 RSC 导航、用户显式选择一起吞掉——每一条都对应下面一组用例。
import { describe, it, expect } from "vitest";
import { handleLocaleGeo, LOCALE_COOKIE } from "./locale-proxy";

type ReqInit = {
  pathname?: string;
  method?: string;
  country?: string | null;
  cookie?: string | null;
  userAgent?: string;
  dest?: string | null;
  accept?: string;
};

function makeReq({
  pathname = "/",
  method = "GET",
  country = "CN",
  cookie = null,
  userAgent = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  dest = "document",
  accept = "text/html,application/xhtml+xml",
}: ReqInit = {}) {
  const headers = new Headers({ "user-agent": userAgent, accept });
  if (country) headers.set("x-vercel-ip-country", country);
  if (dest) headers.set("sec-fetch-dest", dest);

  return {
    headers,
    method,
    nextUrl: { pathname },
    url: `https://zapbridge.tech${pathname}`,
    cookies: { get: (name: string) => (cookie && name === LOCALE_COOKIE ? { value: cookie } : undefined) },
  } as unknown as Parameters<typeof handleLocaleGeo>[0];
}

const location = (res: Response | null) => res?.headers.get("location");

describe("handleLocaleGeo 首页 IP 语言分流", () => {
  it("大陆 IP 访问首页 → 307 跳 /zh", () => {
    const res = handleLocaleGeo(makeReq());
    expect(res?.status).toBe(307);
    expect(location(res)).toBe("https://zapbridge.tech/zh");
  });

  it("非大陆 IP → 不跳转，留在英文首页", () => {
    expect(handleLocaleGeo(makeReq({ country: "US" }))).toBeNull();
    expect(handleLocaleGeo(makeReq({ country: "SG" }))).toBeNull();
  });

  it("港澳台按「仅大陆」口径不跳转（无繁体词典，跳过去只会拿到简体）", () => {
    for (const country of ["HK", "TW", "MO"]) {
      expect(handleLocaleGeo(makeReq({ country }))).toBeNull();
    }
  });

  it("识别不出国家（本地开发、缺头）→ 不跳转", () => {
    expect(handleLocaleGeo(makeReq({ country: null }))).toBeNull();
  });

  it("跳转响应禁止被缓存：同一 URL 因人而异，CDN 缓存会把中文跳转发给全球", () => {
    const res = handleLocaleGeo(makeReq());
    expect(res?.headers.get("cache-control")).toContain("no-store");
  });

  describe("用户显式选择优先于 IP", () => {
    it("cookie=en 时大陆 IP 也不跳（否则切换器点了会被弹回来）", () => {
      expect(handleLocaleGeo(makeReq({ cookie: "en" }))).toBeNull();
    });

    it("cookie=zh 时非大陆 IP 也跳中文", () => {
      const res = handleLocaleGeo(makeReq({ country: "US", cookie: "zh" }));
      expect(location(res)).toBe("https://zapbridge.tech/zh");
    });

    it("cookie 值非法时忽略，回落到 IP 判定", () => {
      expect(location(handleLocaleGeo(makeReq({ cookie: "ja" })))).toBe("https://zapbridge.tech/zh");
      expect(handleLocaleGeo(makeReq({ country: "US", cookie: "ja" }))).toBeNull();
    });
  });

  describe("爬虫豁免：保住 canonical / hreflang 信号", () => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
      "GPTBot/1.2",
      "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    ];

    it("主流搜索与 AI 爬虫从大陆 IP 抓取时不跳转", () => {
      for (const userAgent of bots) {
        expect(handleLocaleGeo(makeReq({ userAgent }))).toBeNull();
      }
    });

    it("爬虫豁免不受 cookie 影响", () => {
      expect(handleLocaleGeo(makeReq({ userAgent: bots[0], cookie: "zh" }))).toBeNull();
    });
  });

  describe("只处理浏览器的首页文档请求", () => {
    it("非首页路由一律不管（/pricing 等保持用户点进来的语言）", () => {
      for (const pathname of ["/pricing", "/templates", "/zh", "/zh/pricing", "/admin", "/api/leads"]) {
        expect(handleLocaleGeo(makeReq({ pathname }))).toBeNull();
      }
    });

    it("客户端 RSC 导航/预取不跳转，否则语言切换器的链接会被中间件劫回中文", () => {
      expect(handleLocaleGeo(makeReq({ dest: "empty", accept: "text/x-component" }))).toBeNull();
    });

    it("非 GET/HEAD 不跳转", () => {
      expect(handleLocaleGeo(makeReq({ method: "POST" }))).toBeNull();
    });

    it("HEAD 与 GET 同等对待", () => {
      expect(location(handleLocaleGeo(makeReq({ method: "HEAD" })))).toBe("https://zapbridge.tech/zh");
    });

    it("缺 sec-fetch-dest 的老浏览器按 Accept 兜底判定文档请求", () => {
      expect(location(handleLocaleGeo(makeReq({ dest: null })))).toBe("https://zapbridge.tech/zh");
      expect(handleLocaleGeo(makeReq({ dest: null, accept: "*/*" }))).toBeNull();
    });
  });
});
