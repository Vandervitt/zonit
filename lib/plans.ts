export type PlanId = "free" | "starter" | "pro" | "agency";

export interface PlanConfig {
  id: PlanId;
  label: string;
  priceText: string;            // 仅展示
  color: string;
  highlight?: boolean;          // "最受欢迎"
  // 后端强制限额
  landingPagesLimit: number;
  domainsLimit: number;
  // 特性标记
  hasWatermark: boolean;
  allTemplates: boolean;
  advancedTracking: boolean;
  antiBan: boolean;
  aiTranslation: boolean;
  // AI 用量（月额度；Infinity = 不限）
  aiPageQuota: number;
  aiRewriteQuota: number;
  // 相对下一档的「增量」权益要点（首页/billing 递进式卡片用；free 为基础项）。
  // 展示侧会自动在非 free 档前加「包含<上一档>全部权益」，故此处只列本档新增。
  highlights: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free", label: "Free", priceText: "$0", color: "slate",
    landingPagesLimit: 1, domainsLimit: 0,
    hasWatermark: true, allTemplates: true, advancedTracking: false, antiBan: false, aiTranslation: false,
    aiPageQuota: 3, aiRewriteQuota: 10,
    highlights: ["1 张落地页", "全量全行业爆款营销模板", "可视化编辑器", "在线预览（发布需升级绑定域名）"],
  },
  starter: {
    id: "starter", label: "Starter", priceText: "$29/mo", color: "blue",
    landingPagesLimit: 3, domainsLimit: 1,
    hasWatermark: true, allTemplates: true, advancedTracking: false, antiBan: false, aiTranslation: false,
    aiPageQuota: 15, aiRewriteQuota: 100,
    highlights: ["3 张落地页 + 1 个自定义域名", "1× Meta Pixel 追踪"],
  },
  pro: {
    id: "pro", label: "Pro", priceText: "$79/mo", color: "violet", highlight: true,
    landingPagesLimit: 20, domainsLimit: 5,
    hasWatermark: false, allTemplates: true, advancedTracking: true, antiBan: true, aiTranslation: false,
    aiPageQuota: 80, aiRewriteQuota: Infinity,
    highlights: ["20 张落地页 + 5 个域名", "去除品牌水印", "全矩阵像素 + Meta CAPI", "反同质化风控引擎"],
  },
  agency: {
    id: "agency", label: "Agency", priceText: "$199/mo", color: "amber",
    landingPagesLimit: Infinity, domainsLimit: Infinity,
    hasWatermark: false, allTemplates: true, advancedTracking: true, antiBan: true, aiTranslation: true,
    aiPageQuota: 300, aiRewriteQuota: Infinity,
    highlights: ["无限落地页 + 无限域名", "AI 自动多语言翻译"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "agency"];

// 对比表行定义：valueFor 返回字符串（额度）或布尔（有无）
export interface PlanFeatureRow {
  label: string;
  valueFor: (plan: PlanConfig) => string | boolean;
}

const fmtLimit = (n: number, unit: string) => (n === Infinity ? "无限" : n === 0 ? "—" : `${n} ${unit}`);

export const PLAN_FEATURE_ROWS: PlanFeatureRow[] = [
  { label: "落地页数量", valueFor: (p) => fmtLimit(p.landingPagesLimit, "张") },
  { label: "自定义域名", valueFor: (p) => fmtLimit(p.domainsLimit, "个") },
  { label: "精美模板", valueFor: () => true },
  { label: "完整视觉编辑器", valueFor: () => true },
  { label: "基础数据追踪 (1× Meta Pixel)", valueFor: () => true },
  { label: "去除品牌水印", valueFor: (p) => !p.hasWatermark },
  { label: "全矩阵像素追踪 (TikTok / CAPI)", valueFor: (p) => p.advancedTracking },
  { label: "反同质化风控引擎", valueFor: (p) => p.antiBan },
  { label: "AI 多语言翻译", valueFor: (p) => p.aiTranslation },
  { label: "AI 整页生成", valueFor: (p) => fmtLimit(p.aiPageQuota, "次/月") },
  { label: "AI 智能改写", valueFor: (p) => fmtLimit(p.aiRewriteQuota, "次/月") },
];

export function getLandingPagesLimit(plan: PlanId): number {
  return PLANS[plan].landingPagesLimit;
}
export function hasWatermark(plan: PlanId): boolean {
  return PLANS[plan].hasWatermark;
}
export function hasAntiBan(plan: PlanId): boolean {
  return PLANS[plan].antiBan;
}
export function canBindDomain(plan: PlanId): boolean {
  return PLANS[plan].domainsLimit > 0;
}
