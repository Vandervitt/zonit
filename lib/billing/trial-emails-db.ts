// 试用邮件序列的数据访问层。纯逻辑在 lib/billing/trial-emails.ts。
import pool from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/plans";
import { REMIND_BEFORE_DAYS, type TrialEmailStage } from "./trial-emails";

const DAY_MS = 86_400_000;

export interface TrialEmailCandidate {
  userId: string;
  email: string;
  expiresAt: Date;
  /** 即将/已经失效的赠送档。 */
  grantedPlan: PlanId;
  /** 回落后的付费档（用于文案与超额判定）。 */
  fallbackPlan: PlanId;
  overQuota: boolean;
  sentStages: TrialEmailStage[];
}

/**
 * 取处在三个窗口任一之内的赠送用户。
 *
 * 窗口在 SQL 里就收窄（now-2d ~ now+3d），历史早已过期的用户根本不进候选集——
 * 这是上线首日不群发挽回信的第一道闸，第二道是 resolveTrialEmail 的窗口判定。
 *
 * 只取 plan = 'free'：期间已经付费的用户不该再收「你的试用要到期了」。
 * 被禁用账号跳过，同 listQuotaCandidates。
 *
 * sent_stages 按 grant_expires_at 关联，因此超管二次赠送（新的到期时刻）
 * 会得到空数组，整个序列自然重跑。
 */
export async function listTrialEmailCandidates(now: Date): Promise<TrialEmailCandidate[]> {
  const res = await pool.query(
    `SELECT u.id    AS user_id,
            u.email,
            u.plan,
            u.comp_plan,
            u.comp_plan_expires_at,
            (SELECT COUNT(*) FROM landing_pages lp
              WHERE lp.user_id = u.id AND lp.status = 'published')::int AS published,
            ARRAY(SELECT te.stage FROM trial_emails te
                   WHERE te.user_id = u.id
                     AND te.grant_expires_at = u.comp_plan_expires_at) AS sent_stages
       FROM users u
      WHERE u.disabled_at IS NULL
        AND u.plan = 'free'
        AND u.comp_plan IS NOT NULL
        AND u.comp_plan_expires_at IS NOT NULL
        AND u.comp_plan_expires_at >  $1
        AND u.comp_plan_expires_at <= $2`,
    [new Date(now.getTime() - 2 * DAY_MS), new Date(now.getTime() + REMIND_BEFORE_DAYS * DAY_MS)],
  );

  return res.rows.map((r) => {
    const fallbackPlan = (r.plan ?? "free") as PlanId;
    const limit = PLANS[fallbackPlan].landingPagesLimit;
    return {
      userId: r.user_id,
      email: r.email,
      expiresAt: new Date(r.comp_plan_expires_at),
      grantedPlan: (r.comp_plan ?? "pro") as PlanId,
      fallbackPlan,
      overQuota: r.published > limit,
      sentStages: (r.sent_stages ?? []) as TrialEmailStage[],
    };
  });
}

/** 标记已发；幂等（同 platform_milestones 的写法），并发重复跑不会重发。 */
export async function markTrialEmailSent(
  userId: string,
  stage: TrialEmailStage,
  grantExpiresAt: Date,
): Promise<void> {
  await pool.query(
    `INSERT INTO trial_emails (user_id, stage, grant_expires_at)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [userId, stage, grantExpiresAt],
  );
}
