import type { Metadata } from "next";
import Link from "next/link";
import { LayoutTemplate, Pencil, Globe } from "lucide-react";
import { Routes } from "@/lib/constants";
import { PlanComparison } from "@/components/billing/PlanComparison";

export const metadata: Metadata = {
  title: "Zap Bridge — 几分钟做出并发布投放级落地页",
  description: "无需开发，基于行业模板做出并发布一张投放级落地页到你自己的域名，专为海外获客打造。",
  openGraph: {
    type: "website",
    title: "Zap Bridge — 几分钟做出并发布投放级落地页",
    description: "无需开发，基于行业模板做出并发布投放级落地页到你自己的域名。",
  },
};

const STEPS = [
  { icon: LayoutTemplate, title: "选模板", desc: "从行业模板库挑一套，开箱即用。" },
  { icon: Pencil, title: "改内容", desc: "可视化编辑文案与图片，自动保存、实时预览。" },
  { icon: Globe, title: "发布到自有域名", desc: "绑定你的品牌域名，一键发布，利于投放与 SEO。" },
];

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* 1. 顶部导航 */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">Zap Bridge</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={Routes.Pricing} className="text-slate-600 hover:text-slate-900">套餐定价</Link>
            <Link href={Routes.Login} className="text-slate-600 hover:text-slate-900">登录</Link>
            <Link href={Routes.Register} className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">免费开始</Link>
          </nav>
        </div>
      </header>

      {/* 2. Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          无需开发，几分钟做出并发布<br className="hidden md:block" />投放级落地页到你自己的域名
        </h1>
        <p className="mt-5 text-lg text-slate-500">
          为做海外获客的个人创业者与小团队打造：选模板 → 改内容 → 发布，页面跑在你的品牌域名上。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={Routes.Register} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700">免费开始</Link>
          <Link href={Routes.Pricing} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">查看套餐</Link>
        </div>
      </section>

      {/* 3. 三步流程 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6">
              <Icon className="w-6 h-6 text-slate-900" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 套餐区（复用单一数据源） */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">简单透明的定价</h2>
          <p className="mt-2 text-slate-500">先用免费版起步，按需升级。</p>
        </div>
        <PlanComparison showTable={false} />
        <div className="text-center mt-6">
          <Link href={Routes.Pricing} className="text-sm text-violet-600 hover:underline">查看完整功能对比 →</Link>
        </div>
      </section>

      {/* 5. 页脚 */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Zap Bridge</span>
          <nav className="flex items-center gap-4">
            <Link href={Routes.Pricing} className="hover:text-slate-900">套餐定价</Link>
            <Link href={Routes.Login} className="hover:text-slate-900">登录</Link>
            <Link href={Routes.Register} className="hover:text-slate-900">免费开始</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
