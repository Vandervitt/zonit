import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";
import { getPublishedBySlug } from "@/lib/landing-pages/store";

// 多租户 sitemap：仅在租户自有域名下输出其唯一已发布落地页（根路径）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hostname = hostnameOf((await headers()).get("host"));
  if (!isCustomDomain(hostname)) return [];

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
