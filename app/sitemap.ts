import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { GUIDES } from "@/app/guides/_content";
import { templateDetailPath, guideDetailPath } from "@/lib/constants";
import { marketingEntries } from "@/lib/seo/sitemap-entries";

// 多租户 sitemap：租户自有域名输出其唯一已发布落地页（根路径）；
// 平台主域输出营销页 + 公开模板画廊（SEO 获客面）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hostname = hostnameOf((await headers()).get("host"));
  if (!isCustomDomain(hostname)) {
    const base = `https://${hostname}`;
    const now = new Date();
    const marketing = marketingEntries(base, now);
    const templates: MetadataRoute.Sitemap = TEMPLATES.map((t) => ({
      url: `${base}${templateDetailPath(t.id)}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
      url: `${base}${guideDetailPath(g.slug)}`,
      lastModified: new Date(g.dateModified ?? g.datePublished),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
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
