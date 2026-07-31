import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { resolveTenantRoute } from "@/lib/domains-db";
import { ROOT_PATH } from "@/lib/domains/route-path";
import { getPublishedBySlug } from "@/lib/landing-pages/store";

// 按访问 host 动态生成：读 header 使其成为每请求动态路由（绕过默认缓存）。
export default async function robots(): Promise<MetadataRoute.Robots> {
  const hostname = hostnameOf((await headers()).get("host"));

  // 租户自有域名：仅托管一张已发布落地页。
  if (isCustomDomain(hostname)) {
    const slug = await resolveTenantRoute(hostname, ROOT_PATH);
    const page = slug ? await getPublishedBySlug(slug) : null;
    // 该页 noindex → 禁收录整站（自有域单页），不输出 sitemap。
    if (page?.data.seo?.noindex) {
      return { rules: { userAgent: "*", disallow: "/" } };
    }
    return {
      rules: { userAgent: "*", allow: "/" },
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
