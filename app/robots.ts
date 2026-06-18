import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";

// 按访问 host 动态生成：读 header 使其成为每请求动态路由（绕过默认缓存）。
export default async function robots(): Promise<MetadataRoute.Robots> {
  const hostname = hostnameOf((await headers()).get("host"));

  // 租户自有域名：仅托管一张已发布落地页，允许收录并指向其 sitemap。
  if (isCustomDomain(hostname)) {
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
