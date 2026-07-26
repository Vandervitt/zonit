// lib/seo/site.ts
// 平台主站（zapbridge.tech）站点级 SEO/GEO 事实源：品牌常量、绝对 URL、
// 结构化数据（JSON-LD）与营销页统一 metadata 构造。
// 仅用于平台自有营销面，禁止用于租户 /p 落地页——否则会把平台品牌实体
// （Organization/WebSite）注入客户页面，污染其 SEO/GEO 归属。
import type { Metadata } from "next";

// 生产由 Vercel 注入 NEXT_PUBLIC_APP_URL（= https://zapbridge.tech）；本地为
// http://localhost:3001；空值兜底到主域，避免 metadataBase / OG 解析到 localhost。
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://zapbridge.tech"
).replace(/\/+$/, "");

export const SITE_NAME = "Zap Bridge";

// 营销站内容为简体中文（面向中国出海广告主）。
export const SITE_LOCALE = "zh_CN";

export const SITE_DESCRIPTION =
  "Zap Bridge 是面向海外获客的投放级落地页平台：30+ 行业模板 + AI 整页成稿，几分钟做出第一版；发布到自有品牌域名，像素、UTM 与服务端转化回传一站配好。";

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
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  /** 自定义 OG 图（如模板缩略图）；缺省用品牌 OG 卡片。 */
  ogImage?: string;
}): Metadata {
  const canonical = absoluteUrl(input.path);
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;
  const ogImage = input.ogImage
    ? { url: input.ogImage, alt: input.title }
    : { url: OG_IMAGE_URL, width: 1200, height: 630, alt: SITE_NAME };
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
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
export function siteStructuredData(): Record<string, unknown> {
  const orgId = `${SITE_URL}/#organization`;
  const siteId = `${SITE_URL}/#website`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/brand-mark.svg"),
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "zh-CN",
        publisher: { "@id": orgId },
      },
    ],
  };
}
