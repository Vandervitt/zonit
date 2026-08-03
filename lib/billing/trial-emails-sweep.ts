// 试用 / 赠送到期邮件序列的每日对账（cron/daily 子任务）。
// 纯逻辑在 trial-emails.ts，数据访问在 trial-emails-db.ts。
import * as Sentry from "@sentry/nextjs";
import { PLANS } from "@/lib/plans";
import { sendTrialEmail } from "@/lib/email";
import { resolveTrialEmail, type TrialEmailStage } from "./trial-emails";
import { listTrialEmailCandidates, markTrialEmailSent } from "./trial-emails-db";

const DAY_MS = 86_400_000;

export interface TrialEmailSweepResult {
  scanned: number;
  sent: Record<TrialEmailStage, number>;
  failed: number;
}

export async function sweepTrialEmails(
  now: Date,
  appUrl: string,
): Promise<TrialEmailSweepResult> {
  const result: TrialEmailSweepResult = {
    scanned: 0,
    sent: { t_minus_3: 0, expiry_day: 0, win_back: 0 },
    failed: 0,
  };

  const candidates = await listTrialEmailCandidates(now);
  result.scanned = candidates.length;

  for (const c of candidates) {
    try {
      const stage = resolveTrialEmail(
        { expiresAt: c.expiresAt, overQuota: c.overQuota, sentStages: c.sentStages },
        now,
      );
      if (!stage) continue;

      const r = await sendTrialEmail(c.email, {
        stage,
        grantedPlanLabel: PLANS[c.grantedPlan].label,
        fallbackPlanLabel: PLANS[c.fallbackPlan].label,
        daysLeft: Math.max(1, Math.ceil((c.expiresAt.getTime() - now.getTime()) / DAY_MS)),
        appUrl,
      });
      // 发送失败不标记：下次跑批仍在窗口内就会重试，出了窗口就作罢。
      // 宁可漏发也不要标记成功后无人再管。
      if (!("success" in r)) {
        result.failed++;
        continue;
      }

      await markTrialEmailSent(c.userId, stage, c.expiresAt);
      result.sent[stage]++;
    } catch (err) {
      result.failed++;
      console.error(`[trial-emails] 用户 ${c.userId} 处理失败:`, err);
      Sentry.captureException(err, {
        tags: { job: "trial-emails-sweep" },
        extra: { userId: c.userId },
      });
    }
  }

  return result;
}
