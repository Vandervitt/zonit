import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { GUIDE_SLUGS, getGuide } from "@/app/guides/_content";
import { templateDetailPath, guideDetailPath } from "@/lib/constants";
import { marketingEntries, localizedDetailEntries } from "@/lib/seo/sitemap-entries";

// 多租户 sitemap：租户自有域名输出其唯一已发布落地页（根路径）；
// 平台主域输出营销页 + 公开模板画廊（SEO 获客面）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hostname = hostnameOf((await headers()).get("host"));
  if (!isCustomDomain(hostname)) {
    const base = `https://${hostname}`;
    const now = new Date();
    const marketing = marketingEntries(base, now);
    // 模板详情页已双语（PR 3），每套出 en/zh 两条并互挂 hreflang。
    const templates = localizedDetailEntries(
      base,
      TEMPLATES.map((t) => ({ routePath: templateDetailPath(t.id), lastModified: now })),
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
    return [...marketing, ...templates, ...guides];
  }

  const slug = await getLandingSlugByCustomDomain(hostname);
  if (!slug) return [];
  const page = await getPublishedBySlug(slug);
  if (!page) return [];

  return [
    {
      url: `https://${hostname}/`,
      lastModified: new Date(page.updated_at ?? Date.now()),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
