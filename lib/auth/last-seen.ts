import pool from "@/lib/db";

// jwt 回调每个请求都会跑，逐请求写会把一次页面浏览放大成多次 UPDATE。
// 节流条件放进 WHERE：窗口内命中 0 行，不产生行版本，代价只是一次主键查找。
const LAST_SEEN_THROTTLE = "1 hour";

export async function touchLastSeen(userId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE users SET last_seen_at = NOW()
        WHERE id = $1
          AND (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '${LAST_SEEN_THROTTLE}')`,
      [userId]
    );
  } catch (err) {
    // 活跃度只是运营观测，绝不能因为它挂掉登录态。
    console.error("touchLastSeen failed:", err);
  }
}
