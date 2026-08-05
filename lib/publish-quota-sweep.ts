// 每日发布配额对账：把纯逻辑（publish-quota.ts）接到数据与通知上。
import * as Sentry from "@sentry/nextjs";
import { reconcilePublishQuota, GRACE_DAYS } from "@/lib/publish-quota";
import {
  listQuotaCandidates,
  setOverQuotaSince,
  unpublishForQuota,
  daysLeftOf,
} from "@/lib/publish-quota-db";
import { sendPublishQuotaEmail } from "@/lib/email";

export interface SweepResult {
  scanned: number;
  started: number;
  reminded: number;
  cleared: number;
  enforced: number;
  unpublished: number;
  failed: number;
}

/**
 * 逐用户对账。单个用户失败不影响其余用户 —— 这是每日 cron 里的一环，
 * 一个坏数据把整轮扫描带崩，会让所有人的宽限计时停摆。
 *
 * 邮件失败不阻断状态流转：宽限起算/解除是事实记录，不能因为发信失败就不记；
 * 且后台横幅是第二条通道（平台只知道邮件是否交给 Resend，不知道客户是否收到）。
 */
export async function sweepPublishQuota(now: Date, appUrl: string): Promise<SweepResult> {
  const result: SweepResult = {
    scanned: 0, started: 0, reminded: 0, cleared: 0, enforced: 0, unpublished: 0, failed: 0,
  };

  const candidates = await listQuotaCandidates(now);
  result.scanned = candidates.length;

  for (const c of candidates) {
    try {
      const action = reconcilePublishQuota({
        limit: c.limit,
        pages: c.pages,
        overQuotaSince: c.overQuotaSince,
        now,
      });

      switch (action.kind) {
        case "none":
          break;

        case "start_grace":
          await setOverQuotaSince(c.userId, now);
          result.started++;
          await notify(c.email, {
            stage: "start",
            published: c.pages.length,
            limit: c.limit,
            planLabel: c.planLabel,
            daysLeft: GRACE_DAYS,
            appUrl,
            locale: c.locale,
          });
          break;

        case "remind":
          result.reminded++;
          await notify(c.email, {
            stage: "remind",
            published: c.pages.length,
            limit: c.limit,
            planLabel: c.planLabel,
            daysLeft: c.overQuotaSince ? daysLeftOf(c.overQuotaSince, now, GRACE_DAYS) : 1,
            appUrl,
            locale: c.locale,
          });
          break;

        case "clear_grace":
          await setOverQuotaSince(c.userId, null);
          result.cleared++;
          break;

        case "enforce": {
          const n = await unpublishForQuota(action.unpublishIds);
          // 先下线再清起算时间：中途失败则下次对账重来，不会留下「已清标记但没下线」。
          await setOverQuotaSince(c.userId, null);
          result.enforced++;
          result.unpublished += n;
          await notify(c.email, {
            stage: "enforced",
            published: c.pages.length - n,
            limit: c.limit,
            planLabel: c.planLabel,
            daysLeft: 0,
            unpublishedCount: n,
            appUrl,
            locale: c.locale,
          });
          break;
        }
      }
    } catch (err) {
      result.failed++;
      console.error(`[publish-quota] 用户 ${c.userId} 对账失败:`, err);
      Sentry.captureException(err, {
        tags: { job: "publish-quota-sweep" },
        extra: { userId: c.userId },
      });
    }
  }

  return result;
}

async function notify(
  email: string,
  params: Parameters<typeof sendPublishQuotaEmail>[1],
): Promise<void> {
  try {
    await sendPublishQuotaEmail(email, params);
  } catch (err) {
    console.error("[publish-quota] 通知邮件发送失败（不阻断）:", err);
    Sentry.captureException(err, { tags: { job: "publish-quota-sweep", stage: "email" } });
  }
}
