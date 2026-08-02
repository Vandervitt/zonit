// 落地页自检器的公开接口。
//
// 匿名可用，**不触发 Vercel Sandbox**——Hobby 档超额后沙箱创建会被暂停到下个
// 计费周期（功能死一个月而非扣钱），且吞吐上限是每分钟数次。让匿名流量碰
// Sandbox 等于「越成功死得越快」。实测确认留给登录侧（设计文档 11.7）。
//
// 安全面全部在 lib/tools/url-guard.ts，本文件只负责限频、缓存与落库。
import { NextRequest, NextResponse } from "next/server";
import { allowRequest, bucketKey } from "@/lib/rate-limit-db";
import { runPageCheck } from "@/lib/tools/run-check";
import { saveReport, findRecentReport } from "@/lib/tools/store";
import { parseTargetUrl } from "@/lib/tools/url-guard";
import { isLocale, type Locale } from "@/lib/i18n/config";

/** 抓取外站需要时间，给足余量（策略层自身有 10s 超时）。 */
export const maxDuration = 60;

/** 两个桶叠加：小时桶挡突发，日桶挡长时间刷。 */
const HOURLY = { windowMs: 3_600_000, max: 5 };
const DAILY = { windowMs: 86_400_000, max: 20 };

/** 同一 URL 的结果复用窗口——既省资源，也是对被检查站点的基本礼貌。 */
const CACHE_WINDOW_MS = 15 * 60_000;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw) return NextResponse.json({ error: "url_required" }, { status: 400 });

  const locale: Locale =
    typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";

  // 入口校验先行：明显非法的输入不该消耗限频额度，也不该触发任何网络请求。
  const parsed = parseTargetUrl(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_url", reason: parsed.reason }, { status: 400 });
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  // 缓存命中不计入限频：同一个人反复看同一份报告不该被惩罚。
  const cached = await findRecentReport(parsed.url.toString(), locale, CACHE_WINDOW_MS);
  if (cached) return NextResponse.json({ id: cached.id, cached: true });

  if (!(await allowRequest(bucketKey("pagecheck-h", ip), HOURLY))) {
    return NextResponse.json({ error: "rate_limited", scope: "hour" }, { status: 429 });
  }
  if (!(await allowRequest(bucketKey("pagecheck-d", ip), DAILY))) {
    return NextResponse.json({ error: "rate_limited", scope: "day" }, { status: 429 });
  }

  let report;
  try {
    report = await runPageCheck(parsed.url.toString());
  } catch (e) {
    // 抓取外站什么都可能发生；失败要留下痕迹而不是静默 500。
    console.error("[page-check] 检查失败", parsed.url.hostname, (e as Error).message);
    return NextResponse.json({ error: "check_failed" }, { status: 502 });
  }

  try {
    const id = await saveReport({
      report,
      inputUrl: parsed.url.toString(),
      host: parsed.url.hostname,
      locale,
      ip,
    });
    return NextResponse.json({ id, cached: false });
  } catch (e) {
    console.error("[page-check] 报告落库失败", (e as Error).message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}
