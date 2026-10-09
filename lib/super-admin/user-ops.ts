// super-admin 用户页的运营视图：每个预设视图回答一个「今天该联系谁」的问题。
// 纯函数、客户端可用——用户量在千级以内时前端过滤足够，且切视图零等待。
import type { MilestoneEvent } from "@/lib/platform-milestones";

const DAY_MS = 86400_000;

/** 激活阶梯。domain_verified 不在其中：用平台子域发布可以完全跳过它。 */
export const ACTIVATION_STAGES = ["signup", "page_created", "page_published", "first_lead"] as const;
export type ActivationStage = (typeof ACTIVATION_STAGES)[number];

export function activationStage(milestones: readonly MilestoneEvent[]): ActivationStage {
  for (let i = ACTIVATION_STAGES.length - 1; i > 0; i--) {
    if (milestones.includes(ACTIVATION_STAGES[i])) return ACTIVATION_STAGES[i];
  }
  return "signup";
}

/** 距到期的天数，不足一天按 1 天；已过期 ≤ 0；无到期（永久或无赠送）为 null。 */
export function daysUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS);
}

export interface OpsFacts {
  createdAt: string;
  /** null = 自 last_seen_at 上线后从未出现过。 */
  lastSeenAt: string | null;
  milestones: MilestoneEvent[];
  /** 首次发布时间（里程碑）。 */
  publishedAt: string | null;
  lastLeadAt: string | null;
  compExpiresAt: string | null;
  paid: boolean;
  disabled: boolean;
  internal: boolean;
}

export const OPS_VIEWS = ["all", "stuck_no_page", "published_no_lead", "trial_ending", "dormant"] as const;
export type OpsView = (typeof OPS_VIEWS)[number];

const olderThan = (iso: string | null, days: number, now: Date) =>
  iso !== null && now.getTime() - new Date(iso).getTime() > days * DAY_MS;

export function matchesView(f: OpsFacts, view: OpsView, now: Date): boolean {
  if (view === "all") return true;
  // 待办只面向真实客户：内部号与已封禁账号不需要被跟进。
  if (f.internal || f.disabled) return false;
  switch (view) {
    case "stuck_no_page":
      return !f.milestones.includes("page_created") && olderThan(f.createdAt, 3, now);
    case "published_no_lead":
      return olderThan(f.publishedAt, 7, now) && (f.lastLeadAt === null || olderThan(f.lastLeadAt, 7, now));
    case "trial_ending": {
      const d = daysUntil(f.compExpiresAt, now);
      return !f.paid && d !== null && d > 0 && d <= 3;
    }
    case "dormant":
      // last_seen_at 是 10-08 才上线的，老用户为 null；退回注册时间，
      // 否则上线前的沉默用户永远进不了这个视图。
      return olderThan(f.lastSeenAt ?? f.createdAt, 14, now);
  }
}
