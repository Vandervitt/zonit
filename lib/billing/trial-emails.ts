// 试用 / 赠送到期的三封邮件序列（纯逻辑，无 IO —— 便于穷举边界）。
//
// 与 lib/publish-quota.ts 同构：comp_plan 过期是纯时间驱动的，没有可埋点的
// 「降档时刻」，因此只能由每日对账按「当前处于哪个窗口」推导。
//
// ⚠️ 三个窗口都是窄区间，这是上线安全的关键：合并当天库里已有一批早就过期的
// comp_plan 用户，若判定写成「已过期且没发过」，第一次 cron 就会给他们群发挽回信。
// 窄窗口让历史用户天然落在窗口外，不需要额外的 backfill 标记。
//
// 代价：cron 漏跑一天会漏一封，且不补发。有意为之——宁可少发一封，也不要在
// 第 10 天突然告诉人家「你的试用昨天到期了」。

export const TRIAL_EMAIL_STAGES = ["t_minus_3", "expiry_day", "win_back"] as const;
export type TrialEmailStage = (typeof TRIAL_EMAIL_STAGES)[number];

/** 到期前多少天发第一封提醒。 */
export const REMIND_BEFORE_DAYS = 3;

const DAY_MS = 86_400_000;

export interface TrialCandidate {
  /** 赠送档到期时刻（users.comp_plan_expires_at）。 */
  expiresAt: Date;
  /**
   * 回落后是否超额（已发布页数 > 回落档额度）。
   * 超额者由 sweepPublishQuota 的配额信序列承担到期叙事，这里让位，避免同日两封。
   */
  overQuota: boolean;
  /** 本次赠送实例已发过的阶段。 */
  sentStages: TrialEmailStage[];
}

/** 当前时刻该用户处于哪个窗口；不在任何窗口内为 null。 */
function stageOf(expiresAt: Date, now: Date): TrialEmailStage | null {
  const diff = expiresAt.getTime() - now.getTime();
  if (diff > 0) return diff <= REMIND_BEFORE_DAYS * DAY_MS ? "t_minus_3" : null;
  // 已到期：按过期时长落进 expiry_day（不足 1 天）或 win_back（1~2 天）
  const elapsed = -diff;
  if (elapsed < DAY_MS) return "expiry_day";
  if (elapsed < 2 * DAY_MS) return "win_back";
  return null;
}

/** 本次跑批该给这个用户发哪一封；无则 null。 */
export function resolveTrialEmail(c: TrialCandidate, now: Date): TrialEmailStage | null {
  const stage = stageOf(c.expiresAt, now);
  if (!stage) return null;
  if (c.sentStages.includes(stage)) return null;
  // 超额者的到期与挽回叙事让位给更具体的配额信；T-3 时配额序列尚未开始，不冲突。
  if (c.overQuota && stage !== "t_minus_3") return null;
  return stage;
}
