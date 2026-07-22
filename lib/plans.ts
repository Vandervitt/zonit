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
  basicPixel: boolean;      // 基础 Meta 客户端 pixel（当前四档全含，作为体验漏斗）
  advancedTracking: boolean;
  antiBan: boolean;
  leadWebhook: boolean;     // 线索 webhook 出站（CRM 集成，Pro/Agency）
  // AI 用量（月额度；Infinity = 不限）
  aiPageQuota: number;
  aiRewriteQuota: number;
  // 相对下一档的「增量」权益要点（首页/billing 递进式卡片用；free 为基础项）。
  // 展示侧会自动在非 free 档前加「包含<上一档>全部权益」，故此处只列本档新增。
  highlights: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free", label: "Free", priceText: "CN¥0", color: "slate",
    landingPagesLimit: 1, domainsLimit: 0,
    hasWatermark: true, basicPixel: true, advancedTracking: false, antiBan: false, leadWebhook: false,
    aiPageQuota: 3, aiRewriteQuota: 10,
    highlights: ["1 张落地页", "全量 30+ 海外获客模板", "可视化内容编辑器", "在线预览（发布需升级绑定域名）"],
  },
  starter: {
    id: "starter", label: "Starter", priceText: "CN¥29.99/月", color: "blue",
    landingPagesLimit: 3, domainsLimit: 1,
    hasWatermark: true, basicPixel: true, advancedTracking: false, antiBan: false, leadWebhook: false,
    aiPageQuota: 15, aiRewriteQuota: 100,
    highlights: ["3 张落地页 + 1 个自定义域名", "1× Meta Pixel 追踪"],
  },
  pro: {
    id: "pro", label: "Pro", priceText: "CN¥79.99/月", color: "violet", highlight: true,
    landingPagesLimit: 20, domainsLimit: 5,
    hasWatermark: false, basicPixel: true, advancedTracking: true, antiBan: false, leadWebhook: true,
    aiPageQuota: 80, aiRewriteQuota: Infinity,
    highlights: ["20 张落地页 + 5 个域名", "去除品牌水印", "Meta / TikTok / Google 追踪 + Meta / TikTok CAPI"],
  },
  agency: {
    id: "agency", label: "Agency", priceText: "CN¥199.99/月", color: "amber",
    landingPagesLimit: Infinity, domainsLimit: Infinity,
    hasWatermark: false, basicPixel: true, advancedTracking: true, antiBan: true, leadWebhook: true,
    aiPageQuota: 300, aiRewriteQuota: Infinity,
    highlights: ["无限落地页 + 无限域名", "反同质化", "AI 生成额度提升至 300 次/月"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "agency"];

// 对比表行定义：valueFor 返回字符串（额度）或布尔（有无）；desc 为该权益的作用说明。
export interface PlanFeatureRow {
  label: string;
  desc: string;
  valueFor: (plan: PlanConfig) => string | boolean;
}

const fmtLimit = (n: number, unit: string) => (n === Infinity ? "无限" : n === 0 ? "—" : `${n} ${unit}`);

export const PLAN_FEATURE_ROWS: PlanFeatureRow[] = [
  { label: "落地页数量", desc: "可创建并保存的落地页总数", valueFor: (p) => fmtLimit(p.landingPagesLimit, "张") },
  { label: "自定义域名", desc: "把页面发布到你自己的品牌域名", valueFor: (p) => fmtLimit(p.domainsLimit, "个") },
  { label: "海外获客模板", desc: "30+ 咨询与留资模板，可直接作为编辑起点", valueFor: () => true },
  { label: "可视化内容编辑器", desc: "表单编辑文案与图片，支持区块排序和实时预览", valueFor: () => true },
  { label: "基础数据追踪 (1× Meta Pixel)", desc: "接入 1 个 Meta Pixel，追踪落地页转化", valueFor: (p) => p.basicPixel },
  { label: "去除品牌水印", desc: "移除页面底部平台水印，纯你的品牌", valueFor: (p) => !p.hasWatermark },
  { label: "多平台追踪与 CAPI", desc: "Meta / TikTok / Google 追踪 + Meta / TikTok 服务端回传", valueFor: (p) => p.advancedTracking },
  { label: "反同质化", desc: "更换页面变体种子打散结构指纹，降低同模板页面被判重的概率", valueFor: (p) => p.antiBan },
  { label: "线索 Webhook 推送", desc: "新线索实时 POST 到你的 CRM / Zapier（含签名）", valueFor: (p) => p.leadWebhook },
  { label: "AI 整页生成", desc: "输入业务资料，AI 按当前模板生成整页营销文案", valueFor: (p) => fmtLimit(p.aiPageQuota, "次/月") },
  { label: "AI 智能改写", desc: "逐段润色改写文案，快速产出多个版本", valueFor: (p) => fmtLimit(p.aiRewriteQuota, "次/月") },
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
export function hasLeadWebhook(plan: PlanId): boolean {
  return PLANS[plan].leadWebhook;
}
export function canBindDomain(plan: PlanId): boolean {
  return PLANS[plan].domainsLimit > 0;
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
