import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { replaySpooledLeads } from "@/lib/leads/spool";
import { computeLeadNudges, markNudged } from "@/lib/leads/nudge";
import { pruneRateLimitHits } from "@/lib/rate-limit-db";
import { pruneExpiredReports } from "@/lib/tools/store";
import { touchSnapshot } from "@/lib/tools/sandbox-check";
import { consumeSandboxBudget } from "@/lib/tools/sandbox-budget";
import { getRetryableEvents } from "@/lib/capi/events-store";
import { flushEvents } from "@/lib/capi/dispatch";
import { getRetryableDeliveries } from "@/lib/webhooks/deliveries-store";
import { deliverMany } from "@/lib/webhooks/dispatch";
import { computeWeeklyDigests, trendText } from "@/lib/digest";
import { sweepPublishQuota } from "@/lib/publish-quota-sweep";
import { sweepTrialEmails } from "@/lib/billing/trial-emails-sweep";
import { sendWeeklyDigestEmail, sendLeadNudgeEmail } from "@/lib/email";
import { Routes } from "@/lib/constants";

/**
 * 每日 cron 编排器（Vercel Hobby 计划 cron 数量有限，多任务合并为一条）：
 * ① 线索兜底重投 ② CAPI 兜底重发 ③ 线索 webhook 兜底重投 ④ 未读线索提醒
 * ⑤ 限频计数清理 ⑥ 周报摘要（仅周一实际发送，?digest=force 可强制）
 * ⑦ 发布配额对账与降档宽限 ⑧ 试用/赠送到期邮件序列（排在 ⑦ 之后，与配额信互斥）。
 * 各任务相互隔离：任一失败不影响其余任务。鉴权用 CRON_SECRET。
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};

  // 线索兜底重投优先：落库失败被暂存的线索是真金白银，早一轮回库早一轮跟进。
  try {
    result.leadSpool = await replaySpooledLeads();
  } catch (err) {
    console.error("cron/daily lead-spool-replay failed:", err);
    result.leadSpoolError = true;
  }

  try {
    const rows = await getRetryableEvents();
    await flushEvents(rows);
    result.capiFlushed = rows.length;
  } catch (err) {
    console.error("cron/daily capi-flush failed:", err);
    result.capiError = true;
  }

  try {
    const rows = await getRetryableDeliveries();
    await deliverMany(rows);
    result.webhookFlushed = rows.length;
  } catch (err) {
    console.error("cron/daily webhook-flush failed:", err);
    result.webhookError = true;
  }

  const now = new Date();

  // 未读线索提醒：静置超 48h 且没被打开过的线索，每条只提醒一次。
  // 只有邮件确实发出才 markNudged，否则提醒会被静默吞掉且永不重试。
  try {
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const nudges = await computeLeadNudges(now);
    let sent = 0;
    for (const n of nudges) {
      const r = await sendLeadNudgeEmail({
        to: n.email,
        leads: n.leads,
        totalCount: n.totalCount,
        dashboardUrl: `${appUrl}${Routes.Leads}`,
        settingsUrl: `${appUrl}${Routes.Settings}`,
        locale: n.locale,
      });
      if ("success" in r && r.success) {
        await markNudged(n.leadIds);
        sent += 1;
      }
    }
    result.leadNudgeSent = sent;
    result.leadNudgeCandidates = nudges.length;
  } catch (err) {
    console.error("cron/daily lead-nudge failed:", err);
    result.leadNudgeError = true;
  }

  // 发布配额对账：降档没有可埋点的时刻（effectivePlan 读时计算、comp_plan 过期
  // 纯时间驱动），只能每日重算「当前是否超额」。放在线索类任务之后——它会取消
  // 发布页面，是本编排器里唯一改变客户线上状态的任务，应在数据类任务落定后再跑。
  try {
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    result.publishQuota = await sweepPublishQuota(now, appUrl);
  } catch (err) {
    console.error("cron/daily publish-quota sweep failed:", err);
    result.publishQuotaError = true;
  }

  // 试用/赠送到期邮件序列。必须排在配额对账之后：超额用户的到期叙事由上面那封
  // 更具体的配额信承担，这里会跳过他们的到期信与挽回信（见 resolveTrialEmail），
  // 避免同一天两封讲同一件事。
  try {
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    result.trialEmails = await sweepTrialEmails(now, appUrl);
  } catch (err) {
    console.error("cron/daily trial-emails sweep failed:", err);
    result.trialEmailsError = true;
  }

  // 限频计数行清理：留 24 小时足够任何窗口回看，再久只是占空间。
  try {
    result.rateLimitPruned = await pruneRateLimitHits();
    result.pageCheckReportsPruned = await pruneExpiredReports();
  } catch (err) {
    console.error("cron/daily rate-limit-prune failed:", err);
    result.rateLimitPruneError = true;
  }

  // 自检器快照保活：快照在最后一次使用后 30 天过期，长期无人使用会让下一次
  // 实测退回 29.5s 冷启动。每天摸一次即可，成本约每月 30 次创建（额度 5,000）。
  // 走预算守卫记账，避免「保活」在额度紧张时吃掉最后的余量。
  try {
    const budget = await consumeSandboxBudget();
    if (budget.allowed) {
      const r = await touchSnapshot();
      result.snapshotTouched = r.touched;
      if (!r.touched) result.snapshotTouchReason = r.reason;
    } else {
      result.snapshotTouched = false;
      result.snapshotTouchReason = budget.reason;
    }
  } catch (err) {
    console.error("cron/daily snapshot-touch failed:", err);
    result.snapshotTouchError = true;
  }

  const isMonday = now.getUTCDay() === 1;
  const force = request.nextUrl.searchParams.get("digest") === "force";
  if (isMonday || force) {
    try {
      const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      const digests = await computeWeeklyDigests(now);
      let sent = 0;
      for (const d of digests) {
        const r = await sendWeeklyDigestEmail({
          to: d.email,
          pages: d.pages.map((p) => ({
            name: p.name,
            views: p.views,
            ctaClicks: p.ctaClicks,
            leads: p.leads,
            viewsTrend: trendText(p.views, p.prevViews),
            ctaTrend: trendText(p.ctaClicks, p.prevCtaClicks),
            leadsTrend: trendText(p.leads, p.prevLeads),
          })),
          dashboardUrl: `${appUrl}${Routes.Analytics}`,
          settingsUrl: `${appUrl}${Routes.Settings}`,
          locale: d.locale,
        });
        if ("success" in r && r.success) sent += 1;
      }
      result.digestSent = sent;
      result.digestCandidates = digests.length;
    } catch (err) {
      console.error("cron/daily weekly-digest failed:", err);
      result.digestError = true;
    }
  } else {
    result.digestSkipped = "not_monday";
  }

  return NextResponse.json(result);
}
