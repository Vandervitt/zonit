import Link from "next/link";
import { Check, X } from "lucide-react";
import { Routes } from "@/lib/constants";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const FEATURES: { label: string; key: keyof typeof FEATURE_VALUES }[] = [
  { label: "活跃站点数", key: "sites" },
  { label: "自定义域名", key: "domains" },
  { label: "精美模板", key: "templates" },
  { label: "完整视觉编辑器", key: "editor" },
  { label: "基础数据追踪 (1× Meta Pixel)", key: "tracking" },
  { label: "去除品牌水印", key: "noWatermark" },
  { label: "全矩阵像素追踪 (TikTok / CAPI)", key: "advTracking" },
  { label: "反同质化风控引擎", key: "antiBan" },
  { label: "AI 多语言翻译", key: "aiTranslation" },
];

const FEATURE_VALUES = {
  sites:         { free: "1 个", starter: "3 个", pro: "20 个", agency: "无限" },
  domains:       { free: "—", starter: "1 个", pro: "5 个", agency: "无限" },
  templates:     { free: true, starter: true, pro: true, agency: true },
  editor:        { free: true, starter: true, pro: true, agency: true },
  tracking:      { free: true, starter: true, pro: true, agency: true },
  noWatermark:   { free: false, starter: false, pro: true, agency: true },
  advTracking:   { free: false, starter: false, pro: true, agency: true },
  antiBan:       { free: false, starter: false, pro: true, agency: true },
  aiTranslation: { free: false, starter: false, pro: false, agency: true },
};

const PLAN_HIGHLIGHT: Partial<Record<PlanId, boolean>> = { pro: true };

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value
      ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
      : <X className="w-4 h-4 text-slate-300 mx-auto" />;
  }
  return <span className="text-sm text-slate-700">{value}</span>;
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">选择适合你的套餐</h1>
          <p className="text-slate-500 text-lg">先用免费版起步，赚到第一桶金后再按需升级</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {PLAN_ORDER.map(planId => {
            const plan = PLANS[planId];
            const highlighted = PLAN_HIGHLIGHT[planId];
            return (
              <div
                key={planId}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                  highlighted
                    ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                {highlighted && (
                  <span className="self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-600 text-white">
                    最受欢迎
                  </span>
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{plan.label}</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {plan.price === "$0" ? "免费" : plan.price.split("/")[0]}
                    {plan.price !== "$0" && (
                      <span className="text-base font-normal text-slate-400">/月</span>
                    )}
                  </p>
                </div>
                <Link
                  href={planId === "free" ? Routes.Register : Routes.Billing}
                  className={`text-center text-sm font-medium py-2 rounded-xl transition-colors ${
                    highlighted
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {planId === "free" ? "免费开始" : "立即升级"}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-4 text-slate-500 font-medium w-1/3">功能</th>
                {PLAN_ORDER.map(planId => (
                  <th key={planId} className={`text-center px-4 py-4 font-semibold ${
                    PLAN_HIGHLIGHT[planId] ? "text-violet-700" : "text-slate-700"
                  }`}>
                    {PLANS[planId].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(({ label, key }, i) => (
                <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-6 py-3 text-slate-600">{label}</td>
                  {PLAN_ORDER.map(planId => (
                    <td key={planId} className="px-4 py-3 text-center">
                      <FeatureValue value={FEATURE_VALUES[key][planId as PlanId]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
