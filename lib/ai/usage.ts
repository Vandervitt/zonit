export interface DbLike {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
}

export type UsageKind = "page" | "rewrite";

export type ConsumeResult =
  | { ok: true; source: "quota" | "credit" }
  | { ok: false; reason: "ai_quota_exhausted" };

/** 统计本自然月某 kind 的用量行数。 */
async function monthCount(db: DbLike, userId: string, kind: UsageKind): Promise<number> {
  const r = await db.query(
    `SELECT count(*)::int AS c FROM ai_usage
     WHERE user_id = $1 AND kind = $2 AND created_at >= date_trunc('month', now())`,
    [userId, kind],
  );
  return Number(r.rows[0]?.c ?? 0);
}

async function creditBalance(db: DbLike, userId: string): Promise<number> {
  const r = await db.query(`SELECT ai_credit_balance FROM users WHERE id = $1`, [userId]);
  return Number(r.rows[0]?.ai_credit_balance ?? 0);
}

/**
 * 检查并扣减一次用量。
 * - page：先月额度，满了用 credit（credit 永不过期）。
 * - rewrite：仅月额度。
 * quota=Infinity 表示不限。
 */
export async function checkAndConsume(
  db: DbLike,
  userId: string,
  kind: UsageKind,
  quota: number,
): Promise<ConsumeResult> {
  if (quota === Infinity) {
    await db.query(`INSERT INTO ai_usage (user_id, kind, source) VALUES ($1, $2, 'quota')`, [userId, kind]);
    return { ok: true, source: "quota" };
  }

  const used = await monthCount(db, userId, kind);
  if (used < quota) {
    await db.query(`INSERT INTO ai_usage (user_id, kind, source) VALUES ($1, $2, 'quota')`, [userId, kind]);
    return { ok: true, source: "quota" };
  }

  if (kind === "page") {
    const bal = await creditBalance(db, userId);
    if (bal > 0) {
      await db.query(`UPDATE users SET ai_credit_balance = ai_credit_balance - 1 WHERE id = $1`, [userId]);
      await db.query(`INSERT INTO ai_usage (user_id, kind, source) VALUES ($1, 'page', 'credit')`, [userId]);
      return { ok: true, source: "credit" };
    }
  }
  return { ok: false, reason: "ai_quota_exhausted" };
}

/**
 * 只读额度预检：不写库，仅判断当前用户是否还有可用额度。
 * 用于生成前的快速拒绝，避免为无额度用户空跑（付费的）模型调用。
 */
export async function hasAllowance(
  db: DbLike,
  userId: string,
  kind: UsageKind,
  quota: number,
): Promise<boolean> {
  if (quota === Infinity) return true;
  const used = await monthCount(db, userId, kind);
  if (used < quota) return true;
  if (kind === "page") return (await creditBalance(db, userId)) > 0;
  return false;
}

/** 给 UI 的用量汇总。 */
export async function getUsageSummary(db: DbLike, userId: string) {
  return {
    pageUsed: await monthCount(db, userId, "page"),
    rewriteUsed: await monthCount(db, userId, "rewrite"),
    creditBalance: await creditBalance(db, userId),
  };
}
