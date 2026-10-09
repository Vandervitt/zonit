// super-admin 运行健康：把两类「出事了却没人知道」的故障摆到看板上。
// - 每日 cron：曾五周没跑过；子任务失败时整体仍返回 200，只看状态码看不出来。
// - AI 一键成页：曾因跨洋调用超时大面积失败，用户只看到转圈。
import { ratePercent } from "./metrics";

const HOUR_MS = 3600_000;
/** 每日任务允许的最大间隔：24h + 调度抖动余量。超过即视为漏跑。 */
const CRON_STALE_HOURS = 26;
/** AI 任务正常 1–2 分钟内结束；超过这个时长仍 pending 基本是后台任务被掐断。 */
const AI_STUCK_MS = 10 * 60_000;

/** daily cron 的结果约定：子任务失败写 `<task>Error: true`。 */
export function failedCronTasks(result: Record<string, unknown>): string[] {
  return Object.entries(result)
    .filter(([k, v]) => k.endsWith("Error") && v === true)
    .map(([k]) => k.slice(0, -"Error".length));
}

export type CronStatus = "ok" | "partial" | "stale" | "never";

export interface CronRunSummary {
  ranAt: string;
  failedTasks: string[];
}

export function cronHealth(last: CronRunSummary | null, now: Date): { status: CronStatus } {
  if (!last) return { status: "never" };
  if (now.getTime() - new Date(last.ranAt).getTime() > CRON_STALE_HOURS * HOUR_MS) return { status: "stale" };
  return { status: last.failedTasks.length > 0 ? "partial" : "ok" };
}

export interface AiJobSample {
  status: string;
  createdAt: string;
}

export interface AiJobHealth {
  /** 已有结论的任务数（成功 + 失败 + 卡死），仍在正常运行的不计入。 */
  total: number;
  failed: number;
  stuck: number;
  /** (失败 + 卡死) / total，%，向下截断；无样本为 null。 */
  failureRate: number | null;
}

export function aiJobHealth(jobs: AiJobSample[], now: Date): AiJobHealth {
  let total = 0, failed = 0, stuck = 0;
  for (const j of jobs) {
    if (j.status === "pending") {
      if (now.getTime() - new Date(j.createdAt).getTime() <= AI_STUCK_MS) continue;
      stuck++;
    } else if (j.status === "failed") {
      failed++;
    }
    total++;
  }
  return { total, failed, stuck, failureRate: ratePercent(failed + stuck, total, 1) };
}
