// 本文件只保留「结构化事实」：限额、权益开关、价格数值。
// 一切展示文案（权益名称、说明、量词、每档要点）都在 lib/i18n/dictionaries/*/plans.ts，
// 由下方展示层函数按 locale 组装——公开营销面出双语，/admin 后台固定取中文。
import type { Locale } from "./i18n/config";
import { plans as enPlans } from "./i18n/dictionaries/en/plans";
import { plans as zhPlans } from "./i18n/dictionaries/zh/plans";
import { approxCnyAmount } from "./pricing/fx";

export type PlanId = "free" | "starter" | "pro" | "agency";

export interface PlanConfig {
  id: PlanId;
  label: string;                // 档位品牌名（Free / Starter / Pro / Agency），不翻译
  priceAmount: number;          // 月费数值（美元）
  currency: string;             // 收款货币固定 USD，不随界面语言变化；中文面另附「约 ¥xx」参考换算
  color: string;
  highlight?: boolean;          // "最受欢迎"
  // 后端强制限额
  landingPagesLimit: number;
  domainsLimit: number;
  // 特性标记
  hasWatermark: boolean;
  basicPixel: boolean;      // 基础 Meta 客户端 pixel（当前四档全含，作为体验漏斗）
  advancedTracking: boolean;
  antiBan: boolean;
  leadWebhook: boolean;     // 线索 webhook 出站（CRM 集成，Pro/Agency）
  // AI 用量（月额度；Infinity = 不限）
  aiPageQuota: number;
  aiRewriteQuota: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free", label: "Free", priceAmount: 0, currency: "$", color: "slate",
    landingPagesLimit: 1, domainsLimit: 0,
    hasWatermark: true, basicPixel: true, advancedTracking: false, antiBan: false, leadWebhook: false,
    aiPageQuota: 3, aiRewriteQuota: 10,
  },
  starter: {
    id: "starter", label: "Starter", priceAmount: 5.99, currency: "$", color: "blue",
    // 多路径发布后，页数额度即发布额度：5 张页可全部挂在这 1 个域名的不同路径下。
    landingPagesLimit: 5, domainsLimit: 1,
    hasWatermark: true, basicPixel: true, advancedTracking: false, antiBan: false, leadWebhook: false,
    aiPageQuota: 15, aiRewriteQuota: 100,
  },
  pro: {
    id: "pro", label: "Pro", priceAmount: 19.99, currency: "$", color: "violet", highlight: true,
    landingPagesLimit: 20, domainsLimit: 5,
    hasWatermark: false, basicPixel: true, advancedTracking: true, antiBan: false, leadWebhook: true,
    aiPageQuota: 80, aiRewriteQuota: Infinity,
  },
  agency: {
    id: "agency", label: "Agency", priceAmount: 49.99, currency: "$", color: "amber",
    landingPagesLimit: Infinity, domainsLimit: Infinity,
    hasWatermark: false, basicPixel: true, advancedTracking: true, antiBan: true, leadWebhook: true,
    aiPageQuota: 300, aiRewriteQuota: Infinity,
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "agency"];

// 注册赠送试用：新用户建号即写入 comp_plan（复用赠送套餐机制，到期由
// activeCompPlan 自动回落，无独立降级逻辑）。对外文案统一「注册即赠 Pro 7 天」。
export const SIGNUP_TRIAL_PLAN: PlanId = "pro";
export const SIGNUP_TRIAL_DAYS = 7;

/** 注册试用到期时刻（从 now 起算）。 */
export function signupTrialExpiry(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + SIGNUP_TRIAL_DAYS);
  return d;
}

export interface CompGrant {
  plan: PlanId;
  expiresAt: Date;
}

/**
 * 建号时写入 comp_plan 的赠送档。
 *
 * 邀请存在则**完全覆盖**默认注册赠送——超管在邀请弹窗里显式选了档位与天数，
 * 那就是他的意图；默认的「注册即赠 Pro 7 天」只是无邀请时的兜底。
 * 不做「取较高档」之类的合并：comp_plan 只有一列，存不下两份赠送，
 * 任何合并规则都会在某个方向上偏离超管的显式选择，反而更难预测。
 *
 * 邀请权益一律走 comp_plan（赠送档），绝不写 users.plan（付费档）——
 * 后者会把受邀用户计入付费统计并污染计费页展示。
 */
export function signupCompGrant(
  invite: { plan: PlanId; durationDays: number } | null | undefined,
  now: Date = new Date(),
): CompGrant {
  if (!invite) return { plan: SIGNUP_TRIAL_PLAN, expiresAt: signupTrialExpiry(now) };
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + invite.durationDays);
  return { plan: invite.plan, expiresAt };
}

/* ------------------------------------------------------------------ *
 * 展示层：结构化数据 + 字典 → 可渲染文案
 * ------------------------------------------------------------------ */

type PlansDict = typeof enPlans;
type LimitUnit = keyof PlansDict["units"];

// 直接引各语言字典模块（而非走 getDictionary），避免 plans.ts ↔ dictionaries/index.ts 循环依赖。
const PLANS_DICT: Record<Locale, PlansDict> = { en: enPlans, zh: zhPlans };

/** 额度展示：Infinity → 不限；0 → 破折号；其余带本地化量词（英文区分单复数）。 */
export function formatPlanLimit(n: number, locale: Locale, unit: LimitUnit): string {
  const t = PLANS_DICT[locale];
  if (n === Infinity) return t.unlimited;
  if (n === 0) return "—";
  const forms = t.units[unit];
  return `${n} ${n === 1 ? forms.one : forms.other}`;
}

/**
 * 参考换算文案：给定汇率时产出「约 ¥xx」，否则为 null。
 * 传 null/undefined 汇率即表示该展示面不需要换算（如英文站），调用方无需分支。
 */
function approxCnyText(plan: PlanConfig, locale: Locale, cnyRate?: number | null): string | null {
  if (cnyRate == null) return null;
  const amount = approxCnyAmount(plan.priceAmount, cnyRate);
  return amount ? PLANS_DICT[locale].approxCny.replace("{amount}", amount) : null;
}

/**
 * 价格展示（拆分版）：对比表里金额与周期后缀分开排版，free 档显示「免费」而非 $0。
 * 金额与货币（USD）不随语言变化，仅周期后缀本地化；
 * 传入 cnyRate 时额外产出人民币参考换算，供中文面在金额下方另起一行展示。
 */
export function planPriceText(
  plan: PlanConfig,
  locale: Locale,
  cnyRate?: number | null,
): { amount: string; suffix: string; approx: string | null } {
  const t = PLANS_DICT[locale];
  if (plan.priceAmount === 0) return { amount: t.free, suffix: "", approx: null };
  return {
    amount: `${plan.currency}${plan.priceAmount}`,
    suffix: t.perMonthSuffix,
    approx: approxCnyText(plan, locale, cnyRate),
  };
}

/**
 * 价格展示（单行版）：等价于改造前的 PlanConfig.priceText，
 * free 档同样输出 `$0`——后台既有排版依赖这一形态，不在货币改造中顺手改 UX。
 */
export function planPriceLabel(plan: PlanConfig, locale: Locale, cnyRate?: number | null): string {
  const suffix = plan.priceAmount === 0 ? "" : PLANS_DICT[locale].perMonthSuffix;
  const approx = approxCnyText(plan, locale, cnyRate);
  return `${plan.currency}${plan.priceAmount}${suffix}${approx ? `（${approx}）` : ""}`;
}

/** 对比表行定义：valueFor 返回字符串（额度）或布尔（有无）；desc 为该权益的作用说明。 */
export interface PlanFeatureRow {
  /** 稳定标识，供测试与后续引用锚定（不随语言变化）。 */
  key: string;
  label: string;
  desc: string;
  valueFor: (plan: PlanConfig) => string | boolean;
}

/** 按字典产出对比表行；权益判定逻辑与语言无关，只有文案随 locale 变化。 */
export function planFeatureRows(t: PlansDict, locale: Locale = "en"): PlanFeatureRow[] {
  const r = t.rows;
  return [
    { key: "landingPages", ...r.landingPages, valueFor: (p) => formatPlanLimit(p.landingPagesLimit, locale, "pages") },
    {
      key: "customDomain",
      ...r.customDomain,
      // Free 的 domainsLimit 是 0，但平台子域不占该额度，它照样能发布——
      // 直接落到 formatPlanLimit 会显示破折号，读起来像「发不了」。
      valueFor: (p) =>
        p.domainsLimit === 0 ? r.customDomain.freeValue : formatPlanLimit(p.domainsLimit, locale, "domains"),
    },
    { key: "templates", ...r.templates, valueFor: () => true },
    { key: "editor", ...r.editor, valueFor: () => true },
    { key: "basicPixel", ...r.basicPixel, valueFor: (p) => p.basicPixel },
    { key: "watermark", ...r.watermark, valueFor: (p) => !p.hasWatermark },
    { key: "advancedTracking", ...r.advancedTracking, valueFor: (p) => p.advancedTracking },
    { key: "antiBan", ...r.antiBan, valueFor: (p) => p.antiBan },
    { key: "leadWebhook", ...r.leadWebhook, valueFor: (p) => p.leadWebhook },
    { key: "aiPage", ...r.aiPage, valueFor: (p) => formatPlanLimit(p.aiPageQuota, locale, "perMonth") },
    { key: "aiRewrite", ...r.aiRewrite, valueFor: (p) => formatPlanLimit(p.aiRewriteQuota, locale, "perMonth") },
  ];
}

export interface PlanEntitlementLine {
  key: string;
  label: string;
  /** 额度型权益的值（如「20 张」）；有无型权益为 null。 */
  value: string | null;
}

/**
 * 某档**实际拥有**的权益清单：布尔为假、额度为 0 的行剔除。
 * 供邮件等无法渲染对比表的场景使用——从 planFeatureRows 派生，
 * 套餐配置或字典一改，产出自动跟着变，不会与 PLANS 漂移。
 */
export function planEntitlementLines(plan: PlanId, locale: Locale = "zh"): PlanEntitlementLine[] {
  const cfg = PLANS[plan];
  return planFeatureRows(PLANS_DICT[locale], locale).flatMap((r) => {
    const v = r.valueFor(cfg);
    if (v === false || v === "—") return [];
    return [{ key: r.key, label: r.label, value: v === true ? null : v }];
  });
}

export function hasWatermark(plan: PlanId): boolean {
  return PLANS[plan].hasWatermark;
}
export function hasAntiBan(plan: PlanId): boolean {
  return PLANS[plan].antiBan;
}
export function hasLeadWebhook(plan: PlanId): boolean {
  return PLANS[plan].leadWebhook;
}
/**
 * 赠送套餐是否仍有效：存在且（无到期=永久 或 到期在将来）→ 返回该档，否则 null。
 * 到期时刻正好等于 now 视为已过期。供各「生效套餐」读取点在算 effectivePlan 前过滤。
 */
export function activeCompPlan(
  compPlan: PlanId | null | undefined,
  expiresAt: Date | string | null | undefined,
  now: Date,
): PlanId | null {
  if (!compPlan) return null;
  if (expiresAt == null) return compPlan;
  const expMs = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return expMs > now.getTime() ? compPlan : null;
}

/** 生效套餐 = max(付费 plan, 超管赠送 comp_plan)；赠送为空时即付费档。 */
export function effectivePlan(plan: PlanId, compPlan: PlanId | null | undefined): PlanId {
  if (!compPlan) return plan;
  return PLAN_ORDER.indexOf(compPlan) > PLAN_ORDER.indexOf(plan) ? compPlan : plan;
}
