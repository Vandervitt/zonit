"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Routes } from "@/lib/constants";
import {
  PLANS,
  PLAN_ORDER,
  SIGNUP_TRIAL_DAYS,
  SIGNUP_TRIAL_PLAN,
  YEARLY_PRICE_MONTHS,
  BILLING_INTERVALS,
  planComparisonLayout,
  planPriceText,
  plansDictionary,
  type BillingInterval,
  type PlanFeatureRow,
  type PlanId,
} from "@/lib/plans";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";
import { ctaGhost, ctaPrimary } from "@/lib/theme";
import { cn } from "@/components/ui/utils";

/**
 * 套餐对比——全站唯一的套餐对照组件：营销站（首页 / 定价页）、后台计费页、超管设置页共用。
 *
 * 客户端组件（月付 / 年付切换需要状态），只用 Tailwind、不依赖 antd。
 * 营销站（服务端组件）不能跨边界传函数，故访客按钮由 `audience="visitor"` 在组件内渲染；
 * 后台需要的交互（结账、降档确认）由客户端调用方经 `cta` 注入自己的 antd 按钮。
 * 文案取 plansDictionary 而非 getDictionary，避免把全部营销字典打进客户端包。
 *
 * 布局按**容器宽度**切换（@container），而不是视口：同一个组件嵌在后台内容区、
 * 首页分区或手机屏里，都按自己实际拿到的宽度决定用表格还是按档位纵排的卡片。
 */
export interface PlanComparisonProps {
  locale?: Locale;
  /** 人民币参考换算汇率；不传（英文面 / 取不到汇率）则只展示美元。 */
  cnyRate?: number | null;
  /** 访客视角：按钮一律去注册页（营销站用）。与 `cta` 二选一。 */
  audience?: "visitor";
  /** 每档的行动按钮（按当前选中的计费周期）；返回 null 表示该档不放按钮。都不传则不渲染按钮区。 */
  cta?: (planId: PlanId, interval: BillingInterval) => ReactNode;
  /** 初始展示的计费周期，默认月付。 */
  defaultInterval?: BillingInterval;
  /** 当前所在档：该列高亮并标「当前套餐」。不传时高亮推荐档。 */
  currentPlan?: PlanId;
  /** 是否在注册试用档上标「注册即送 N 天」——只对还没注册的访客有意义。 */
  showTrialBadge?: boolean;
}

/** 访客（未登录）视角的按钮规格：一律去注册页，注册本身就送试用档。纯函数，便于测试。 */
export function visitorCtaSpec(locale: Locale, planId: PlanId): { href: string; label: string; primary: boolean } {
  const t = plansDictionary(locale).table;
  const href = localePath(locale, Routes.Register);
  if (planId === "free") return { href, label: t.ctaFree, primary: false };
  if (planId === SIGNUP_TRIAL_PLAN) {
    return { href, label: t.ctaTrial.replace("{days}", String(SIGNUP_TRIAL_DAYS)), primary: true };
  }
  return { href, label: t.ctaChoose.replace("{plan}", PLANS[planId].label), primary: false };
}

function VisitorCta({ locale, planId }: { locale: Locale; planId: PlanId }) {
  const spec = visitorCtaSpec(locale, planId);
  return (
    <Link
      href={spec.href}
      className={cn(spec.primary ? ctaPrimary : ctaGhost, "w-full px-3 py-2.5 text-center text-sm")}
    >
      {spec.label}
    </Link>
  );
}

/** 月付 / 年付切换：单选按钮组，方向键与 Tab 均可操作。 */
function IntervalToggle({
  value,
  onChange,
  t,
}: {
  value: BillingInterval;
  onChange: (v: BillingInterval) => void;
  t: { billingPeriod: string; intervalMonth: string; intervalYear: string; yearSave: string };
}) {
  const label = (v: BillingInterval) => (v === "month" ? t.intervalMonth : t.intervalYear);
  return (
    <div
      role="radiogroup"
      aria-label={t.billingPeriod}
      className="inline-flex rounded-full border border-aqua-100 bg-white p-1 text-sm"
    >
      {BILLING_INTERVALS.map((v) => (
        <label
          key={v}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-aqua-400",
            value === v ? "bg-aqua-600 font-medium text-white" : "text-foreground/80 hover:text-aqua-700",
          )}
        >
          <input
            type="radio"
            name="billing-interval"
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            className="sr-only"
          />
          {label(v)}
          {v === "year" && (
            <span className={cn("text-xs", value === v ? "text-white/85" : "text-aqua-700")}>
              {t.yearSave.replace("{months}", String(12 - YEARLY_PRICE_MONTHS))}
            </span>
          )}
        </label>
      ))}
    </div>
  );
}

function FeatureValue({ value, t }: { value: string | boolean; t: { included: string; notIncluded: string } }) {
  if (value === true) {
    return (
      <>
        <Check aria-hidden className="size-4 text-aqua-600" strokeWidth={2.5} />
        <span className="sr-only">{t.included}</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus aria-hidden className="size-4 text-muted-foreground/35" />
        <span className="sr-only">{t.notIncluded}</span>
      </>
    );
  }
  return <span className="font-medium tabular-nums text-foreground">{value}</span>;
}

interface PlanView {
  id: PlanId;
  label: string;
  price: { amount: string; suffix: string; approx: string | null; yearlyNote: string | null };
  badge: string | null;
  fit: string;
  action: ReactNode;
  inLane: boolean;
}

/** 档位抬头：名称 + 徽标、价格、参考换算、适合谁、按钮。表格表头与窄屏卡片共用。 */
function PlanHead({ p, hasCta, compact = false }: { p: PlanView; hasCta: boolean; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      {/* 徽标单独占一行：与档位名同排时，窄列里长文案（英文尤甚）会顶出列宽压到相邻档。
          表格模式下无徽标的列也保留这一行高度，让各档的档位名对齐。 */}
      {(p.badge || !compact) && (
        <div className="min-h-6">
          {p.badge && (
            <span className="inline-block rounded-full bg-aqua-600 px-2.5 py-0.5 text-xs leading-snug font-medium text-white">
              {p.badge}
            </span>
          )}
        </div>
      )}
      <span className="text-base font-semibold text-foreground">{p.label}</span>
      <p className="mt-1 whitespace-nowrap text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">{p.price.amount}</span>
        {p.price.suffix && <span className="ml-0.5 text-sm text-muted-foreground">{p.price.suffix}</span>}
      </p>
      {/* 参考换算另起一行：不能与美元金额同排，否则易被读成结算金额 */}
      <p className={cn("text-xs text-muted-foreground", !compact && "min-h-4")}>{p.price.approx}</p>
      {p.price.yearlyNote && <p className="text-xs font-medium text-aqua-700">{p.price.yearlyNote}</p>}
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{p.fit}</p>
      {hasCta && <div className="mt-3">{p.action}</div>}
    </div>
  );
}

export function PlanComparison({
  locale = "en",
  cnyRate,
  audience,
  cta,
  currentPlan,
  showTrialBadge = false,
  defaultInterval = "month",
}: PlanComparisonProps) {
  const [interval, setBillingInterval] = useState<BillingInterval>(defaultInterval);
  const t = plansDictionary(locale);
  const hasCta = audience === "visitor" || !!cta;
  const layout = planComparisonLayout(t, locale);
  const lanePlan: PlanId = currentPlan ?? PLAN_ORDER.find((id) => PLANS[id].highlight) ?? SIGNUP_TRIAL_PLAN;

  const badgeFor = (planId: PlanId): string | null => {
    if (currentPlan) return planId === currentPlan ? t.table.currentBadge : null;
    if (showTrialBadge && planId === SIGNUP_TRIAL_PLAN) {
      return t.table.trialBadge.replace("{days}", String(SIGNUP_TRIAL_DAYS));
    }
    return null;
  };

  const plans = PLAN_ORDER.map((id) => ({
    id,
    label: PLANS[id].label,
    config: PLANS[id],
    price: planPriceText(PLANS[id], locale, cnyRate, interval),
    badge: badgeFor(id),
    fit: t.fit[id],
    action: audience === "visitor" ? <VisitorCta locale={locale} planId={id} /> : (cta?.(id, interval) ?? null),
    inLane: id === lanePlan,
  }));
  const included = layout.common.length > 0 && (
    <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      <span className="basis-full font-medium text-foreground @lg:basis-auto">{t.table.includedInAll}</span>
      {layout.common.map((row) => (
        <span key={row.key} className="inline-flex items-center gap-1.5">
          <Check aria-hidden className="size-4 text-aqua-600" strokeWidth={2.5} />
          {row.label}
        </span>
      ))}
    </div>
  );

  // 高亮列是一条从表头贯通到底的「泳道」：每个单元格各画左右边，首尾补圆角。
  const lane = (p: { inLane: boolean }, edge?: "top" | "bottom") =>
    p.inLane &&
    cn(
      "border-x border-aqua-200 bg-aqua-50/70",
      edge === "top" && "rounded-t-2xl border-t",
      edge === "bottom" && "rounded-b-2xl border-b",
    );

  const allRows = layout.groups.flatMap((g) => g.rows);
  const lastKey = allRows.at(-1)?.key;

  return (
    <div className="@container">
      <div className="mb-5">
        <IntervalToggle value={interval} onChange={setBillingInterval} t={t.table} />
      </div>
      {included}

      {/* 宽容器：表格 */}
      <div className="hidden @5xl:block">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{t.table.feature}</caption>
          <colgroup>
            <col className="w-[24%]" />
            {plans.map((p) => (
              <col key={p.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                {t.table.feature}
              </th>
              {plans.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className={cn("px-5 pt-5 pb-4 align-top font-normal", lane(p, "top"))}
                >
                  <PlanHead p={p} hasCta={false} />
                </th>
              ))}
            </tr>
            {/* 按钮单独一行：各档「适合谁」长短不一，同格排版时按钮会参差不齐 */}
            {hasCta && (
              <tr>
                <td />
                {plans.map((p) => (
                  <td key={p.id} className={cn("px-5 pb-6 align-top", lane(p))}>
                    {p.action}
                  </td>
                ))}
              </tr>
            )}
          </thead>
          {layout.groups.map((group) => (
            <tbody key={group.id}>
              <tr>
                <th
                  scope="rowgroup"
                  className="border-b border-aqua-100 pt-7 pb-2 text-left text-xs font-semibold text-aqua-700"
                >
                  {group.label}
                </th>
                {plans.map((p) => (
                  <td key={p.id} className={cn("border-b border-aqua-100", lane(p))} />
                ))}
              </tr>
              {group.rows.map((row: PlanFeatureRow) => {
                const isLast = row.key === lastKey;
                return (
                  <tr key={row.key}>
                    <th
                      scope="row"
                      className={cn("py-3 pr-6 text-left align-top font-normal", !isLast && "border-b border-aqua-100/70")}
                    >
                      <span className="block font-medium text-foreground">{row.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{row.desc}</span>
                    </th>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={cn(
                          "px-5 py-3 align-top",
                          !isLast && "border-b border-aqua-100/70",
                          lane(p, isLast ? "bottom" : undefined),
                        )}
                      >
                        <FeatureValue value={row.valueFor(p.config)} t={t.table} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      {/* 窄容器（手机 / 窄内容区）：按档位纵排的卡片，只列该档拥有的权益 */}
      <ul className="grid gap-4 @lg:grid-cols-2 @5xl:hidden">
        {plans.map((p) => (
          <li
            key={p.id}
            className={cn(
              "rounded-2xl border p-5",
              p.inLane ? "border-aqua-200 bg-aqua-50/70" : "border-aqua-100 bg-white",
            )}
          >
            <PlanHead p={p} hasCta={hasCta} compact />
            <ul className="mt-5 space-y-2 border-t border-aqua-100 pt-4 text-sm">
              {allRows.flatMap((row) => {
                const v = row.valueFor(p.config);
                if (v === false) return [];
                return [
                  <li key={row.key} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-aqua-600" strokeWidth={2.5} />
                    <span className="text-foreground">
                      {row.label}
                      {v !== true && <span className="font-medium tabular-nums">{`${t.table.valueSeparator}${v}`}</span>}
                    </span>
                  </li>,
                ];
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
