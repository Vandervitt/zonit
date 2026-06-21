import { PLANS, type PlanId } from "@/lib/plans";

export interface UsageSummary {
  page: { used: number; limit: number | null };
  rewrite: { used: number; limit: number | null };
  creditBalance: number;
}

const norm = (n: number): number | null => (n === Infinity ? null : n);

export function buildUsageSummary(input: {
  plan: PlanId;
  pageUsed: number;
  rewriteUsed: number;
  creditBalance: number;
}): UsageSummary {
  const p = PLANS[input.plan];
  return {
    page: { used: input.pageUsed, limit: norm(p.aiPageQuota) },
    rewrite: { used: input.rewriteUsed, limit: norm(p.aiRewriteQuota) },
    creditBalance: input.creditBalance,
  };
}
