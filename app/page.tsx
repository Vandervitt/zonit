import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import MarketingHome from "@/components/marketing/MarketingHome";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "Zap Bridge — 投放级落地页，几分钟上线到你的域名",
  description:
    "为海外获客打造的智能落地页引擎：15+ 爆款行业模板、可视化实时编辑、一键发布到自有品牌域名，内建全矩阵像素与 Meta CAPI 转化追踪。",
  openGraph: {
    type: "website",
    title: "Zap Bridge — 投放级落地页，几分钟上线到你的域名",
    description:
      "选模板 → 改文案 → 一键发布，跑在你的品牌域名上，内建全矩阵像素与转化追踪，让每一分广告预算都被看见。",
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
