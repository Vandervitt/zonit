import type { Metadata } from "next";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import MarketingHome from "@/components/marketing/MarketingHome";
import { Routes } from "@/lib/constants";
import { marketingMetadata, siteStructuredData } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  ...marketingMetadata({
    title: "Zap Bridge — 投放级海外获客落地页",
    description:
      "为海外获客打造的投放级落地页：30+ 行业模板起步，AI 整页成稿，几分钟出第一版；像素、UTM 与服务端转化回传一站配好，广告费花在能归因、能转化的页面上。",
    path: Routes.Home,
    ogDescription:
      "30+ 咨询与留资模板 + AI 整页成稿，几分钟做出第一版；发布到自有品牌域名，并按套餐配置 Meta、TikTok 与 Google 追踪归因。",
  }),
  // Google Search Console URL 前缀验证（元标签）。未配置环境变量时不输出，
  // 仅注入首页（不泄漏到租户 /p 页面）。域名属性验证走 DNS TXT，无需此项。
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
};

export default function Page() {
  return (
    <>
      <JsonLd data={siteStructuredData()} />
      <MarketingHome
        fonts={{
          display: fontHead.className,
          body: fontBody.className,
          mono: fontMono.className,
        }}
      />
    </>
  );
}
