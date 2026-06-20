import type { LandingPageDraft } from "@/types/schema.draft";
import { isLandingPageStructureValid } from "@/types/schema.draft";
import { deriveSlots } from "./slots";

const BANNED_PATTERNS: RegExp[] = [
  /\b(checkout|add to cart|buy now|order now|subscribe|refund|coupon|discount code)\b/i,
  /购物车|立即购买|马上下单|加入购物车|立即下单|退款|优惠码|折扣码|货到付款/,
  /(?:\$|¥|€|£)\s?\d/,            // 价格符号 + 数字
  /\b\d+(?:\.\d+)?\s?(?:usd|cny|eur|gbp)\b/i,
];

/** 返回命中的禁词/模式片段（空数组表示干净）。 */
export function findBannedTerms(text: string): string[] {
  const hits: string[] = [];
  for (const re of BANNED_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

/** 从候选文案中剔除含禁词的项。 */
export function filterCandidates(candidates: string[]): string[] {
  return candidates.filter((c) => findBannedTerms(c).length === 0);
}

export type ComplianceReason = "banned_terms" | "invalid_structure";

export interface ComplianceResult {
  ok: boolean;
  reason?: ComplianceReason;
  detail?: string;
}

/** 生成后合规校验：禁词扫描 + 结构合法性。 */
export function checkDraftCompliance(draft: LandingPageDraft): ComplianceResult {
  for (const slot of deriveSlots(draft)) {
    const hits = findBannedTerms(slot.text);
    if (hits.length > 0) {
      return { ok: false, reason: "banned_terms", detail: `${slot.id}: ${hits.join(", ")}` };
    }
  }
  if (!isLandingPageStructureValid(draft)) {
    return { ok: false, reason: "invalid_structure" };
  }
  return { ok: true };
}
