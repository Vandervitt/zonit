import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import AntiBanNarrative from "@/components/marketing/AntiBanNarrative";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "反同质化风控 — 让同模板页面不再千篇一律 | Zap Bridge",
  description:
    "页面雷同容易被投放平台判为重复内容，带来拒审与限流。Zap Bridge 的反同质化风控为 Agency 套餐内建：内容保持一致，打散页面结构指纹，降低同模板页面被判重的概率，并支持一键重洗。",
  openGraph: {
    type: "website",
    title: "反同质化风控 — 让同模板页面不再千篇一律",
    description:
      "内容保持一致，结构各不相同。为规模化投放的广告主打散页面结构指纹，降低被相似度检测误判的概率——这不是 cloaking，是正当广告主的护栏。",
  },
};

export default function Page() {
  return (
    <AntiBanNarrative
      fonts={{
        display: display.className,
        body: body.className,
        mono: mono.className,
      }}
    />
  );
}
