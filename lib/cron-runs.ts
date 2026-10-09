import pool from "@/lib/db";
import { failedCronTasks } from "@/lib/super-admin/ops-health";

const RETENTION_DAYS = 90;

/** 记录一次 cron 执行（best-effort：记录失败只打日志，绝不影响 cron 本身的返回）。 */
export async function recordCronRun(job: string, startedAt: Date, result: Record<string, unknown>): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO cron_runs (job, started_at, failed_tasks, result) VALUES ($1, $2, $3, $4)`,
      [job, startedAt, failedCronTasks(result), JSON.stringify(result)],
    );
    await pool.query(`DELETE FROM cron_runs WHERE started_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`);
  } catch (err) {
    console.error(`recordCronRun ${job} failed:`, err);
  }
}
