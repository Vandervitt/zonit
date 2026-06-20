import Link from "next/link";
import { Check, X } from "lucide-react";
import { Routes } from "@/lib/constants";
import { PLANS, PLAN_ORDER, PLAN_FEATURE_ROWS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value
      ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
      : <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />;
  }
  return <span className="text-sm text-foreground/80">{value}</span>;
}

/** 套餐卡片 + 功能对比表。ctaFor 决定每张卡片 CTA 的去向与文案。 */
export function PlanComparison({
  ctaFor,
  showTable = true,
}: {
  ctaFor?: (planId: PlanId) => { href: string; label: string };
  showTable?: boolean;
}) {
  const cta = ctaFor ?? ((planId: PlanId) =>
    planId === "free"
      ? { href: Routes.Register, label: "免费开始" }
      : { href: Routes.Billing, label: "立即升级" });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const c = cta(planId);
          return (
            <div
              key={planId}
              className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                plan.highlight
                  ? "border-bloom-300 bg-bloom-50 shadow-lg shadow-bloom-100"
                  : "border-bloom-100 bg-white"
              }`}
            >
              {plan.highlight && (
                <span className="self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-bloom-600 text-white">
                  最受欢迎
                </span>
              )}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{plan.label}</p>
                <p className="text-3xl font-bold text-foreground">
                  {plan.priceText === "$0" ? "免费" : plan.priceText.split("/")[0]}
                  {plan.priceText !== "$0" && <span className="text-base font-normal text-muted-foreground">/月</span>}
                </p>
              </div>
              <Link
                href={c.href}
                className={`text-center text-sm font-medium py-2 rounded-xl transition-colors ${
                  plan.highlight
                    ? "bg-bloom-600 text-white hover:bg-bloom-700"
                    : "bg-bloom-50 text-foreground/80 hover:bg-bloom-100"
                }`}
              >
                {c.label}
              </Link>
            </div>
          );
        })}
      </div>

      {showTable && (
        <div className="rounded-2xl border border-bloom-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bloom-100 bg-bloom-50">
                <th className="text-left px-6 py-4 text-muted-foreground font-medium w-1/3">功能</th>
                {PLAN_ORDER.map((planId) => (
                  <th key={planId} className={`text-center px-4 py-4 font-semibold ${
                    PLANS[planId].highlight ? "text-bloom-700" : "text-foreground/80"
                  }`}>
                    {PLANS[planId].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURE_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-bloom-50/50"}>
                  <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="px-4 py-3 text-center">
                      <FeatureValue value={row.valueFor(PLANS[planId])} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
