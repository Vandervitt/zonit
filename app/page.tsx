import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import MarketingHome from "@/components/marketing/MarketingHome";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "Zap Bridge — 海外获客落地页，免费创建与预览",
  description:
    "为海外获客打造的落地页工具：30+ 咨询与留资模板、可视化内容编辑、AI 文案生成和实时预览；升级后可发布到自有品牌域名，并配置 Meta、TikTok 与 Google 追踪。",
  openGraph: {
    type: "website",
    title: "Zap Bridge — 海外获客落地页，免费创建与预览",
    description:
      "先免费选模板、改内容并实时预览；准备投放时升级发布到自有品牌域名，并按套餐配置像素、UTM 与服务端转化回传。",
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
