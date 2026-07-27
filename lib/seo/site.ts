// lib/seo/site.ts
// 平台主站（zapbridge.tech）站点级 SEO/GEO 事实源：品牌常量、绝对 URL、
// 结构化数据（JSON-LD）与营销页统一 metadata 构造。
// 仅用于平台自有营销面，禁止用于租户 /p 落地页——否则会把平台品牌实体
// （Organization/WebSite）注入客户页面，污染其 SEO/GEO 归属。
import type { Metadata } from "next";
import { htmlLang, ogLocale, hreflang, defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { localePath, isLocalizedRoute } from "@/lib/i18n/routes";

// 生产由 Vercel 注入 NEXT_PUBLIC_APP_URL（= https://zapbridge.tech）；本地为
// http://localhost:3001；空值兜底到主域，避免 metadataBase / OG 解析到 localhost。
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://zapbridge.tech"
).replace(/\/+$/, "");

export const SITE_NAME = "Zap Bridge";

// 营销站默认英文（面向国际获客客户），中文版走 /zh 前缀。
export const siteDescription: Record<Locale, string> = {
  en: "Zap Bridge is an ad-ready landing page platform for overseas lead generation: 30+ industry templates plus AI full-page drafting get your first version out in minutes, published to your own brand domain with pixels, UTMs, and server-side conversion forwarding built in.",
  zh: "Zap Bridge 是面向海外获客的投放级落地页平台：30+ 行业模板 + AI 整页成稿，几分钟做出第一版；发布到自有品牌域名，像素、UTM 与服务端转化回传一站配好。",
};

/** 以主站域名为 base 拼接绝对 URL（path 会被规整为以 / 开头）。 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 品牌 OG 图（动态生成，见 app/og/route.tsx）。 */
export const OG_IMAGE_URL = absoluteUrl("/og");

/**
 * 营销页统一 metadata：canonical + OpenGraph + Twitter + 品牌 OG 图。
 * 仅供平台营销页使用；显式返回绝对 canonical，避免与租户页面串味。
 */
export function marketingMetadata(input: {
  locale: Locale;
  title: string;
  description: string;
  /** 语言无关的路由路径（如 /pricing）；canonical 由 locale 派生。 */
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  /** 自定义 OG 图（如模板缩略图）；缺省用品牌 OG 卡片。 */
  ogImage?: string;
}): Metadata {
  const canonical = absoluteUrl(localePath(input.locale, input.path));
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;
  const ogImage = input.ogImage
    ? { url: input.ogImage, alt: input.title }
    : { url: OG_IMAGE_URL, width: 1200, height: 630, alt: SITE_NAME };
  // 未进入 LOCALIZED_ROUTES 的页面尚无 /zh 镜像，localePath 会原样返回英文侧路径；
  // 此时若仍输出 languages，en 与 zh-Hans 会指向同一 URL——对搜索引擎是噪音。
  const languages = isLocalizedRoute(input.path)
    ? {
        "x-default": absoluteUrl(localePath(defaultLocale, input.path)),
        ...Object.fromEntries(
          locales.map((l) => [hreflang[l], absoluteUrl(localePath(l, input.path))]),
        ),
      }
    : undefined;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      locale: ogLocale[input.locale],
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage.url],
    },
  };
}

/**
 * 平台组织 + 站点 结构化数据（JSON-LD @graph），置于营销首页。
 * 让搜索引擎与生成式引擎（GEO）明确「Zap Bridge 是谁、做什么、主站在哪」。
 */
export function siteStructuredData(locale: Locale): Record<string, unknown> {
  const orgId = `${SITE_URL}/#organization`;
  const siteId = `${SITE_URL}/#website`;
  const description = siteDescription[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/brand-mark.svg"),
        description,
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        url: SITE_URL,
        name: SITE_NAME,
        description,
        inLanguage: htmlLang[locale],
        publisher: { "@id": orgId },
      },
    ],
  };
}
