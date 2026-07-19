import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import AntiBanNarrative from "@/components/marketing/AntiBanNarrative";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "反同质化风控 — 让每个投放页指纹独立 | Zap Bridge",
  description:
    "海外获客投手最怕页面雷同被平台判重、限流甚至连坐封号。Zap Bridge 的反同质化风控引擎为 Agency 套餐内建：内容对所有人一致，指纹却互不相同，随时可一键重洗。",
  openGraph: {
    type: "website",
    title: "反同质化风控 — 让每个投放页指纹独立",
    description:
      "内容一模一样，指纹各不相同。为规模化投放的广告主打散页面结构指纹，规避查重限流与账户关联——这不是 cloaking，是正当广告主的护栏。",
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
