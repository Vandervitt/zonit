import type { Metadata } from "next";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import MarketingHome from "@/components/marketing/MarketingHome";

export const metadata: Metadata = {
  title: "Zap Bridge — 投放级海外获客落地页",
  description:
    "为海外获客打造的投放级落地页：30+ 行业模板起步，AI 整页成稿，几分钟出第一版；像素、UTM 与服务端转化回传一站配好，广告费花在能归因、能转化的页面上。",
  openGraph: {
    type: "website",
    title: "Zap Bridge — 投放级海外获客落地页",
    description:
      "30+ 咨询与留资模板 + AI 整页成稿，几分钟做出第一版；发布到自有品牌域名，并按套餐配置 Meta、TikTok 与 Google 追踪归因。",
  },
};

export default function Page() {
  return (
    <MarketingHome
      fonts={{
        display: fontHead.className,
        body: fontBody.className,
        mono: fontMono.className,
      }}
    />
  );
}
