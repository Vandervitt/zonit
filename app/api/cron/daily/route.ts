import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRetryableEvents } from "@/lib/capi/events-store";
import { flushEvents } from "@/lib/capi/dispatch";
import { getRetryableDeliveries } from "@/lib/webhooks/deliveries-store";
import { deliverMany } from "@/lib/webhooks/dispatch";
import { computeWeeklyDigests, trendText } from "@/lib/digest";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { Routes } from "@/lib/constants";

/**
 * 每日 cron 编排器（Vercel Hobby 计划 cron 数量有限，多任务合并为一条）：
 * ① CAPI 兜底重发 ② 线索 webhook 兜底重投 ③ 周报摘要（仅周一实际发送，?digest=force 可强制）。
 * 各任务相互隔离：任一失败不影响其余任务。鉴权用 CRON_SECRET。
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};

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
