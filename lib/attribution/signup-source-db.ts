import pool from "@/lib/db";
import type { SignupSource } from "./signup-source";

/** 补报窗口：只接受注册后不久的来源，老账号事后不能再改写自己的来源。 */
const REPORT_WINDOW = "24 hours";

/**
 * 写入注册首触来源，只写一次：已有来源或超出窗口时不动，返回 false。
 * 条件放在 UPDATE 的 WHERE 里，并发补报也只会有一次生效。
 */
export async function recordSignupSource(userId: string, source: SignupSource): Promise<boolean> {
  const result = await pool.query(
    `UPDATE users SET signup_source = $2
      WHERE id = $1
        AND signup_source IS NULL
        AND created_at > NOW() - INTERVAL '${REPORT_WINDOW}'`,
    [userId, JSON.stringify(source)],
  );
  return (result.rowCount ?? 0) > 0;
}
