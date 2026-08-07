import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { listPublishedRoutes } from "@/lib/domains-db";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { GUIDE_SLUGS, getGuide } from "@/app/guides/_content";
import { templateDetailPath, guideDetailPath, templateIndustryPath } from "@/lib/constants";
import { marketingEntries, localizedDetailEntries } from "@/lib/seo/sitemap-entries";
import { SITE_URL } from "@/lib/seo/site";
import { indexableIndustryCategories } from "@/lib/templates/industries";

// 多租户 sitemap：租户自有域名输出其唯一已发布落地页（根路径）；
// 平台主域输出营销页 + 公开模板画廊（SEO 获客面）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hostname = hostnameOf((await headers()).get("host"));
  if (!isCustomDomain(hostname)) {
    // 平台主域一律用 SITE_URL，不跟请求 host 走：canonical / OG 都由 SITE_URL 派生，
    // 这里若改用 hostname，爬虫从 www（或任何 app 子域）进来就会拿到一份与 canonical
    // 声明不一致的 URL 列表，两边互指形成规范化死结。见 app/sitemap.test.ts 顶部注释。
    const base = SITE_URL;
    const now = new Date();
    const marketing = marketingEntries(base, now);
    // 模板详情页已双语（PR 3），每套出 en/zh 两条并互挂 hreflang。
    const templates = localizedDetailEntries(
      base,
      TEMPLATES.map((t) => ({ routePath: templateDetailPath(t.id), lastModified: now })),
    );
    // 行业中间层：只收可索引的行业。模板数不足门槛的行业页输出 noindex，
    // 既声明不收录又列进 sitemap 是自相矛盾的信号。权重高于单模板详情页。
    const industries = localizedDetailEntries(
      base,
      indexableIndustryCategories().map((category) => ({
        routePath: templateIndustryPath(category),
        lastModified: now,
      })),
      0.8,
    );
    // 指南详情页已双语（PR 4），每篇出 en/zh 两条并互挂 hreflang。
    const guides = localizedDetailEntries(
      base,
      GUIDE_SLUGS.map((slug) => {
        const g = getGuide("en", slug)!;
        return {
          routePath: guideDetailPath(slug),
          lastModified: new Date(g.dateModified ?? g.datePublished),
        };
      }),
    );
    return [...marketing, ...industries, ...templates, ...guides];
  }

  // 多路径：该域名下每张已发布页各出一条；noindex 的页不进 sitemap
  // （既声明不收录又列进 sitemap 是自相矛盾的信号）。
  const routes = await listPublishedRoutes(hostname);
  return routes
    .filter((r) => !r.noindex)
    .map((r) => ({
      url: `https://${hostname}${r.path}`,
      lastModified: new Date(r.updated_at ?? Date.now()),
      changeFrequency: "weekly" as const,
      // 根路径是站点入口，权重高于其余服务页。
      priority: r.path === "/" ? 1 : 0.8,
    }));
}
