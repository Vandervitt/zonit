import type { Metadata } from "next";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";

export const metadata: Metadata = marketingMetadata({
  // 尚未国际化：显式声明中文，保持现有 canonical 与描述不变（见 PR 2/3/4）
  locale: "zh",
  title: "套餐与定价 — 注册即赠 Pro 全功能 7 天 | Zap Bridge",
  description:
    "Zap Bridge 套餐与定价：从免费档到 Agency，按海外获客需求选择；注册即赠 Pro 全功能 7 天，先跑通获客链路再按需升级。自有域名发布、像素与服务端转化回传按档位开放。",
  path: Routes.Pricing,
  ogTitle: "套餐与定价 | Zap Bridge",
});

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-aqua-50 via-background to-background py-20 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-glow-1/15 blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-foreground mb-3">选择适合你的套餐</h1>
          <p className="text-muted-foreground text-lg">注册即赠 Pro 全功能 7 天，先跑通获客链路，再按需升级</p>
        </div>
        <PlanComparison locale="zh" />
      </div>
    </main>
  );
}
