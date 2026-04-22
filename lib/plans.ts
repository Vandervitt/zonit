export type PlanId = "free" | "starter" | "pro" | "agency";

export interface PlanConfig {
  label: string;
  price: string;
  sitesLimit: number;
  domainsLimit: number;
  hasWatermark: boolean;
  allTemplates: boolean;
  color: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    label: "Free",
    price: "$0",
    sitesLimit: 1,
    domainsLimit: 0,
    hasWatermark: true,
    allTemplates: false,
    color: "slate",
  },
  starter: {
    label: "Starter",
    price: "$29/mo",
    sitesLimit: 3,
    domainsLimit: 1,
    hasWatermark: true,
    allTemplates: false,
    color: "blue",
  },
  pro: {
    label: "Pro",
    price: "$79/mo",
    sitesLimit: 20,
    domainsLimit: 5,
    hasWatermark: false,
    allTemplates: true,
    color: "violet",
  },
  agency: {
    label: "Agency",
    price: "$199/mo",
    sitesLimit: Infinity,
    domainsLimit: Infinity,
    hasWatermark: false,
    allTemplates: true,
    color: "amber",
  },
};

export function getSitesLimit(plan: PlanId): number {
  return PLANS[plan].sitesLimit;
}

export function hasWatermark(plan: PlanId): boolean {
  return PLANS[plan].hasWatermark;
}

export function canBindDomain(plan: PlanId): boolean {
  return PLANS[plan].domainsLimit > 0;
}

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "agency"];
