import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";
import { auditEntries, type AuditBefore } from "./audit";
import { invalidateAllPublishedPages, invalidateUserPlan } from "@/lib/landing-pages/published-cache";

export interface AdminUserPatch {
  compPlan?: PlanId | null;              // null = 取消赠送
  compPlanExpiresAt?: string | null;     // ISO；null = 永久；取消赠送时随之置空
  role?: "USER" | "SUPER_ADMIN";
  disabled?: boolean;
  isInternal?: boolean;                  // 内部账号（测试号等），排除出运营统计
}

/**
 * 超管更新用户运营字段并写审计；返回是否命中行。调用方负责鉴权与自我保护校验。
 * 读旧值、更新、写审计在同一事务里：审计必须与变更同生共死，否则会有「改了却查不到谁改的」。
 */
export async function updateUserAdminFields(userId: string, patch: AdminUserPatch, actorId: string): Promise<boolean> {
  const set: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (patch.compPlan !== undefined) { set.push(`comp_plan = $${i++}`); values.push(patch.compPlan); }
  if (patch.compPlanExpiresAt !== undefined) { set.push(`comp_plan_expires_at = $${i++}`); values.push(patch.compPlanExpiresAt); }
  if (patch.role !== undefined) { set.push(`role = $${i++}`); values.push(patch.role); }
  if (patch.disabled !== undefined) {
    set.push(patch.disabled ? `disabled_at = COALESCE(disabled_at, NOW())` : `disabled_at = NULL`);
  }
  if (patch.isInternal !== undefined) { set.push(`is_internal = $${i++}`); values.push(patch.isInternal); }
  if (set.length === 0) return false;
  values.push(userId);

  const client = await pool.connect();
  let result;
  try {
    await client.query("BEGIN");
    const beforeRes = await client.query(
      `SELECT comp_plan, comp_plan_expires_at, role, disabled_at, is_internal FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (beforeRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    result = await client.query(`UPDATE users SET ${set.join(", ")} WHERE id = $${i} RETURNING id`, values);
    for (const e of auditEntries(beforeRes.rows[0] as AuditBefore, patch)) {
      await client.query(
        `INSERT INTO admin_audit_logs (actor_id, target_user_id, action, detail) VALUES ($1, $2, $3, $4)`,
        [actorId, userId, e.action, JSON.stringify(e.detail)],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  const hit = result.rows.length > 0;

  // 这里改的每个字段都会改变公开落地页的渲染结果，故必须失效读缓存：
  // - disabled  → 被禁账号的页面必须立刻从公网消失（封禁是超管的核心能力，
  //               getPublishedBySlug 的 `u.disabled_at IS NULL` 就是为它写的）
  // - compPlan  → 影响水印与埋点门控
  // 失效放在这一层而不是各调用方，是因为漏调的后果是静默的：
  // 页面看起来一切正常，只是封禁没生效。
  if (hit) {
    invalidateUserPlan(userId);
    if (patch.disabled !== undefined) invalidateAllPublishedPages();
  }
  return hit;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  plan: PlanId;
  comp_plan: PlanId | null;
  comp_plan_expires_at: string | null;
  role: string;
  disabled_at: string | null;
  invited_at: string | null;
  created_at: string;
  billing_provider: string | null;
  billing_customer_id: string | null;
  leads_count: number;
  last_seen_at: string | null;
  milestones: { event: string; created_at: string }[];
  ai_jobs: { status: string; reason: string | null; created_at: string }[];
  trial_emails: { stage: string; sent_at: string }[];
  feedback: { source: string; message: string; created_at: string }[];
  notes: AdminUserNote[];
  audit: { action: string; detail: { before: unknown; after: unknown }; actor_email: string | null; created_at: string }[];
  pages: { id: string; name: string; status: string; slug: string | null; bound_domain: string | null }[];
}

/** 用户详情：基础信息 + 名下落地页（含绑定域名）+ 线索总数。不存在返回 null。 */
export async function getUserAdminDetail(userId: string): Promise<AdminUserDetail | null> {
  const userRes = await pool.query(
    `SELECT id, name, email, plan, comp_plan, comp_plan_expires_at, role, disabled_at, invited_at, created_at, last_seen_at, billing_provider, billing_customer_id
       FROM users WHERE id = $1`,
    [userId],
  );
  if (userRes.rows.length === 0) return null;
  const pagesRes = await pool.query(
    `SELECT lp.id, lp.name, lp.status, lp.slug, d.domain AS bound_domain
       FROM landing_pages lp
       LEFT JOIN LATERAL (
         SELECT dom.domain
           FROM domain_routes r
           JOIN domains dom ON dom.id = r.domain_id
          WHERE r.landing_page_id = lp.id AND dom.enabled = true AND dom.verified = true
          LIMIT 1
       ) d ON true
     WHERE lp.user_id = $1 ORDER BY lp.updated_at DESC`,
    [userId],
  );
  const leadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM leads l
       JOIN landing_pages lp ON lp.id = l.page_id
     WHERE lp.user_id = $1`,
    [userId],
  );
  // 运营时间线：昨天排查「两位用户卡在哪」要手写的那几条 SQL，在这里一次取齐。
  const [milestonesRes, aiJobsRes, trialRes, feedbackRes, notes, auditRes] = await Promise.all([
    pool.query(`SELECT event, created_at FROM platform_milestones WHERE user_id = $1 ORDER BY created_at`, [userId]),
    pool.query(
      `SELECT status, reason, created_at FROM landing_page_ai_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId],
    ),
    pool.query(`SELECT stage, sent_at FROM trial_emails WHERE user_id = $1 ORDER BY sent_at`, [userId]),
    pool.query(
      `SELECT source, message, created_at FROM feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [userId],
    ),
    listUserNotes(userId),
    pool.query(
      `SELECT l.action, l.detail, a.email AS actor_email, l.created_at
         FROM admin_audit_logs l LEFT JOIN users a ON a.id = l.actor_id
        WHERE l.target_user_id = $1 ORDER BY l.created_at DESC LIMIT 50`,
      [userId],
    ),
  ]);
  return {
    ...userRes.rows[0],
    leads_count: leadsRes.rows[0].count,
    pages: pagesRes.rows,
    milestones: milestonesRes.rows,
    ai_jobs: aiJobsRes.rows,
    trial_emails: trialRes.rows,
    feedback: feedbackRes.rows,
    notes,
    audit: auditRes.rows,
  };
}

export interface AdminUserNote {
  id: string;
  body: string;
  author_email: string | null;
  created_at: string;
}

export async function listUserNotes(userId: string): Promise<AdminUserNote[]> {
  const res = await pool.query(
    `SELECT n.id, n.body, a.email AS author_email, n.created_at
       FROM user_admin_notes n LEFT JOIN users a ON a.id = n.author_id
      WHERE n.user_id = $1 ORDER BY n.created_at DESC`,
    [userId],
  );
  return res.rows;
}

/** 追加一条跟进备注；目标用户不存在返回 false。 */
export async function addUserNote(userId: string, authorId: string, body: string): Promise<boolean> {
  const res = await pool.query(
    `INSERT INTO user_admin_notes (user_id, author_id, body)
       SELECT id, $2, $3 FROM users WHERE id = $1
     RETURNING id`,
    [userId, authorId, body],
  );
  return res.rows.length > 0;
}
