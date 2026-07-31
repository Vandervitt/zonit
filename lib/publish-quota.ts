// 发布配额的降档宽限对账（纯逻辑，无 IO —— 便于穷举边界）。
//
// 为什么是「每日对账」而不是「降档时触发」：
// getUserPlan 返回的是读时计算的 effectivePlan = max(plan, comp_plan)
// （lib/plans-db.ts）。其中 comp_plan 过期是**纯时间驱动**的 —— 过期那一刻
// 没有任何代码运行，因此根本不存在可埋点的「降档时刻」。整个流转只能由
// 「当前是否超额」推导。好处是天然幂等：cron 漏跑一天，次日照样补上；客户
// 中途自己下线到达标，次日自动解除宽限，不需要额外的干预入口。
//
// 精度是天级（Vercel Hobby 只允许每天一条 cron，且已被 /api/cron/daily 占用），
// 故对外文案写「7 天后」，不写精确时刻。

/** 宽限天数：超额后给客户处理的缓冲期。 */
export const GRACE_DAYS = 7;

/** 到期前多少天发提醒。 */
const REMIND_BEFORE_DAYS = 1;

const DAY_MS = 86_400_000;

export interface QuotaPage {
  id: string;
  /** 发布时间；缺失视为「最新」，优先被下线。 */
  publishedAt: string | Date | null;
  /** 是否发布在域名根路径。 */
  isRoot: boolean;
}

export type QuotaAction =
  | { kind: "none" }
  /** 首次发现超额：记录起算时间并发首封通知。 */
  | { kind: "start_grace" }
  /** 临近到期：再发一封提醒。 */
  | { kind: "remind" }
  /** 已恢复达标：清除起算时间。 */
  | { kind: "clear_grace" }
  /** 宽限到期：把这些页取消发布（unpublish，非删除）。 */
  | { kind: "enforce"; unpublishIds: string[] };

const timeOf = (p: QuotaPage): number => {
  if (!p.publishedAt) return Number.POSITIVE_INFINITY; // 无时间 → 最新 → 先下线
  const t = new Date(p.publishedAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

/**
 * 挑出应当保留的页：根路径页优先（否则域名根直接 404，伤害最大），
 * 其余按发布时间从早到晚 —— 越早发布的越可能是主力页、外部链接越多。
 */
function keepIds(pages: QuotaPage[], limit: number): Set<string> {
  const ranked = [...pages].sort((a, b) => {
    if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
    return timeOf(a) - timeOf(b);
  });
  return new Set(ranked.slice(0, Math.max(0, limit)).map((p) => p.id));
}

export function reconcilePublishQuota(input: {
  /** 该用户生效套餐的 landingPagesLimit，可为 Infinity。 */
  limit: number;
  /** 当前处于 published 状态的页。 */
  pages: QuotaPage[];
  /** 已记录的超额起算时间；null 表示此前未超额。 */
  overQuotaSince: Date | null;
  now: Date;
}): QuotaAction {
  const { limit, pages, overQuotaSince, now } = input;

  if (pages.length <= limit) {
    // 达标。若此前在宽限中（含客户自行下线到达标的情况），解除。
    return overQuotaSince ? { kind: "clear_grace" } : { kind: "none" };
  }

  if (!overQuotaSince) return { kind: "start_grace" };

  const elapsedDays = (now.getTime() - overQuotaSince.getTime()) / DAY_MS;
  if (elapsedDays >= GRACE_DAYS) {
    const keep = keepIds(pages, limit);
    return { kind: "enforce", unpublishIds: pages.filter((p) => !keep.has(p.id)).map((p) => p.id) };
  }
  if (elapsedDays >= GRACE_DAYS - REMIND_BEFORE_DAYS) return { kind: "remind" };
  return { kind: "none" };
}
