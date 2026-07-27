import Link from "next/link";
import { Check, X } from "lucide-react";
import { Routes } from "@/lib/constants";
import { PLANS, PLAN_ORDER, planFeatureRows, planPriceText } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value
      ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
      : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  }
  return <span className="text-sm text-foreground/80">{value}</span>;
}

/**
 * 套餐 × 权益融合对比表：不再用独立卡片。
 * 表头行内嵌每档的「最受欢迎」标签、价格与 CTA；新增「说明」列介绍每项权益的作用。
 * ctaFor 决定每档 CTA 的去向与文案（默认：free→注册、其余→升级）。
 */
export function PlanComparison({
  locale = "en",
  ctaFor,
}: {
  locale?: Locale;
  ctaFor?: (planId: PlanId) => { href: string; label: string };
}) {
  const t = getDictionary(locale).plans;
  const rows = planFeatureRows(t, locale);
  // Routes.Billing 指向 /admin/billing，后台不参与国际化，故不加语言前缀。
  const cta = ctaFor ?? ((planId: PlanId) =>
    planId === "free"
      ? { href: localePath(locale, Routes.Register), label: t.table.ctaFree }
      : { href: Routes.Billing, label: t.table.ctaUpgrade });

  return (
    <div className="overflow-x-auto rounded-2xl border border-aqua-100">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-aqua-100 bg-aqua-50/60 align-bottom">
            <th className="w-[24%] px-6 py-5 text-left font-medium text-muted-foreground">{t.table.feature}</th>
            <th className="w-[28%] px-6 py-5 text-left font-medium text-muted-foreground">{t.table.description}</th>
            {PLAN_ORDER.map((planId) => {
              const plan = PLANS[planId];
              const c = cta(planId);
              const price = planPriceText(plan, locale);
              return (
                <th
                  key={planId}
                  className={`px-4 py-5 text-center align-bottom ${plan.highlight ? "bg-aqua-100/50" : ""}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={`h-5 text-[10px] font-semibold uppercase tracking-wider ${
                        plan.highlight
                          ? "rounded-full bg-aqua-600 px-2 py-0.5 text-white"
                          : "text-transparent"
                      }`}
                    >
                      {t.table.mostPopular}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{plan.label}</span>
                    <span className="text-2xl font-bold text-foreground">
                      {price.amount}
                      {price.suffix && (
                        <span className="text-sm font-normal text-muted-foreground">{price.suffix}</span>
                      )}
                    </span>
                    <Link
                      href={c.href}
                      className={`mt-1 block w-full rounded-xl py-2 text-center text-xs font-semibold transition-colors ${
                        plan.highlight
                          ? "bg-aqua-600 text-white hover:bg-aqua-700"
                          : "bg-aqua-50 text-foreground/80 hover:bg-aqua-100"
                      }`}
                    >
                      {c.label}
                    </Link>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-aqua-50/40"}>
              <td className="px-6 py-3 font-medium text-foreground/90">{row.label}</td>
              <td className="px-6 py-3 text-muted-foreground">{row.desc}</td>
              {PLAN_ORDER.map((planId) => (
                <td
                  key={planId}
                  className={`px-4 py-3 text-center ${PLANS[planId].highlight ? "bg-aqua-50/60" : ""}`}
                >
                  <FeatureValue value={row.valueFor(PLANS[planId])} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
