import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";
import { getPublishedBySlug } from "@/lib/landing-pages/store";

// 按访问 host 动态生成：读 header 使其成为每请求动态路由（绕过默认缓存）。
export default async function robots(): Promise<MetadataRoute.Robots> {
  const hostname = hostnameOf((await headers()).get("host"));

  // 租户自有域名：仅托管一张已发布落地页。
  if (isCustomDomain(hostname)) {
    const slug = await getLandingSlugByCustomDomain(hostname);
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

  // 平台主域：放开营销面（/、/pricing），禁后台与接口。
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/super-admin", "/api"] },
  };
}
