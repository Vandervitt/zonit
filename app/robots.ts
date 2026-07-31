import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { listPublishedRoutes } from "@/lib/domains-db";

// 按访问 host 动态生成：读 header 使其成为每请求动态路由（绕过默认缓存）。
export default async function robots(): Promise<MetadataRoute.Robots> {
  const hostname = hostnameOf((await headers()).get("host"));

  // 租户自有域名：可托管多张已发布落地页（各占一个路径）。
  if (isCustomDomain(hostname)) {
    const routes = await listPublishedRoutes(hostname);
    const indexable = routes.filter((r) => !r.noindex);
    // 一张可收录的页都没有（未发布，或全部 noindex）→ 禁收录整站，不输出 sitemap。
    if (indexable.length === 0) {
      return { rules: { userAgent: "*", disallow: "/" } };
    }
    // 逐页判定：只把 noindex 的那几个路径 disallow，其余放行。
    // 此前按「自有域单页」一刀切禁整站，多路径下会因一张 noindex 页误伤其余页。
    const disallow = routes.filter((r) => r.noindex).map((r) => r.path);
    return {
      rules: { userAgent: "*", allow: "/", ...(disallow.length ? { disallow } : {}) },
      sitemap: `https://${hostname}/sitemap.xml`,
    };
  }

  // 平台主域：放开营销面（/、/pricing、/templates、/anti-ban），禁后台与接口；
  // 显式欢迎生成式引擎/AI 爬虫（GEO），使营销内容可被 AI 摘要抓取与引用。
  const disallow = ["/admin", "/super-admin", "/api"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "Applebot-Extended",
          "cohere-ai",
          "Amazonbot",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `https://${hostname}/sitemap.xml`,
  };
}
