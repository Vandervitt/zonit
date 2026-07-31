// 发布配额对账的数据访问层。纯逻辑在 lib/publish-quota.ts。
import pool from "@/lib/db";
import { activeCompPlan, effectivePlan, PLANS, type PlanId } from "@/lib/plans";
import type { QuotaPage } from "@/lib/publish-quota";

export interface QuotaCandidate {
  userId: string;
  email: string;
  limit: number;
  planLabel: string;
  overQuotaSince: Date | null;
  pages: QuotaPage[];
}

/**
 * 取所有「有已发布页」的用户及其生效额度。
 *
 * 生效套餐必须在这里按同一口径重算（max(plan, comp_plan)，且 comp_plan 需未过期），
 * 不能只读 users.plan —— 赠送套餐残留曾导致生效套餐判定出错（PR #91）。
 * 被禁用的账号跳过：其页面本来就不对外，不该再触发下线与邮件。
 */
export async function listQuotaCandidates(now: Date): Promise<QuotaCandidate[]> {
  const res = await pool.query(
    `SELECT u.id                        AS user_id,
            u.email,
            u.plan,
            u.comp_plan,
            u.comp_plan_expires_at,
            u.publish_over_quota_since,
            json_agg(
              json_build_object(
                'id', lp.id,
                'publishedAt', lp.published_at,
                'isRoot', COALESCE(dr.path = '/', false)
              ) ORDER BY lp.published_at NULLS LAST
            ) AS pages
       FROM users u
       JOIN landing_pages lp ON lp.user_id = u.id AND lp.status = 'published'
       LEFT JOIN domain_routes dr ON dr.landing_page_id = lp.id
      WHERE u.disabled_at IS NULL
      GROUP BY u.id`,
    [],
  );

  return res.rows.map((r) => {
    const comp = activeCompPlan(r.comp_plan as PlanId | null, r.comp_plan_expires_at, now);
    const plan = effectivePlan((r.plan ?? "free") as PlanId, comp);
    return {
      userId: r.user_id,
      email: r.email,
      limit: PLANS[plan].landingPagesLimit,
      planLabel: PLANS[plan].label,
      overQuotaSince: r.publish_over_quota_since ? new Date(r.publish_over_quota_since) : null,
      pages: r.pages as QuotaPage[],
    };
  });
}

export async function setOverQuotaSince(userId: string, at: Date | null): Promise<void> {
  await pool.query("UPDATE users SET publish_over_quota_since = $1 WHERE id = $2", [at, userId]);
}

/**
 * 取消发布（status → draft），并释放其占用的路径。
 *
 * 是 unpublish 不是 delete：草稿内容完整保留，客户升回套餐后可一键重发。
 * 同时删 domain_routes 行 —— 留着会让那个路径一直被占，客户想把别的页放上去
 * 会撞上「位置被占用」，而占位者根本不在线上，无从排查。
 */
export async function unpublishForQuota(pageIds: string[]): Promise<number> {
  if (pageIds.length === 0) return 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `UPDATE landing_pages SET status = 'draft', updated_at = NOW()
        WHERE id = ANY($1) AND status = 'published' RETURNING id`,
      [pageIds],
    );
    await client.query("DELETE FROM domain_routes WHERE landing_page_id = ANY($1)", [pageIds]);
    await client.query("COMMIT");
    return res.rows.length;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** 后台横幅用：当前用户的超额状态。 */
export async function getPublishQuotaStatus(userId: string, now: Date): Promise<{
  overQuotaSince: Date | null;
  publishedCount: number;
  limit: number;
  daysLeft: number | null;
} | null> {
  const res = await pool.query(
    `SELECT u.plan, u.comp_plan, u.comp_plan_expires_at, u.publish_over_quota_since,
            (SELECT COUNT(*)::int FROM landing_pages WHERE user_id = u.id AND status = 'published') AS published_count
       FROM users u WHERE u.id = $1`,
    [userId],
  );
  const r = res.rows[0];
  if (!r) return null;

  const comp = activeCompPlan(r.comp_plan as PlanId | null, r.comp_plan_expires_at, now);
  const plan = effectivePlan((r.plan ?? "free") as PlanId, comp);
  const since = r.publish_over_quota_since ? new Date(r.publish_over_quota_since) : null;

  return {
    overQuotaSince: since,
    publishedCount: r.published_count,
    limit: PLANS[plan].landingPagesLimit,
    daysLeft: since ? daysLeftOf(since, now) : null,
  };
}

/** 剩余天数（向上取整，最小 0）。天级精度，与 cron 频率一致。 */
export function daysLeftOf(since: Date, now: Date, graceDays = 7): number {
  const elapsed = (now.getTime() - since.getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(graceDays - elapsed));
}
