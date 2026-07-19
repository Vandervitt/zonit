import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import MarketingHome from "@/components/marketing/MarketingHome";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

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
        display: display.className,
        body: body.className,
        mono: mono.className,
      }}
    />
  );
}
