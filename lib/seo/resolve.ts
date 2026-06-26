// lib/seo/resolve.ts
// 页面元数据解析：seo 覆盖优先，hero 派生兜底。
import type { LandingPageDraft, HeroSection } from "@/types/schema.draft";

export interface ResolvedMeta {
  title: string;
  description: string;
  ogImage?: string;
  noindex: boolean;
}

/** 从首屏派生 OG 图：优先背景图，其次展示图（视频取封面）。 */
export function heroOgImage(hero: HeroSection): string | undefined {
  if (hero.backgroundImage?.src) return hero.backgroundImage.src;
  if (hero.showcase?.type === "image") return hero.showcase.src;
  if (hero.showcase?.type === "video") return hero.showcase.poster;
  return undefined;
}

const nonBlank = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

export function resolvePageMeta(data: LandingPageDraft): ResolvedMeta {
  const { hero, seo } = data;
  return {
    title: nonBlank(seo?.metaTitle) ?? hero.title.replace(/\n/g, " "),
    description: nonBlank(seo?.metaDescription) ?? hero.subtitle ?? "",
    ogImage: nonBlank(seo?.ogImage) ?? heroOgImage(hero),
    noindex: seo?.noindex === true,
  };
}
