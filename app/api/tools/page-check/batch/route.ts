// 多页对比检查的公开接口。
//
// 与单页接口（../route.ts）的关系：**这里不重新实现检查，只是把它跑 N 遍再分组。**
// 每个 URL 各存一条报告，批次表只记录分组关系，故单页报告页对批次内每条依然可用。
//
// 限频的取舍：**按 URL 计费，不按请求计费。** 一次 5 个 URL 的提交要扣 5 次额度，
// 否则「一次请求换 5 倍抓取」会让现有预算形同虚设——对被检查的第三方站点，
// 我们发起的请求数才是真实成本，请求数不是。
//
// 同样不触发 Sandbox（理由见单页接口注释）。
import { NextRequest, NextResponse } from "next/server";
import { allowRequest, bucketKey } from "@/lib/rate-limit-db";
import { runPageCheck } from "@/lib/tools/run-check";
import { saveReport, saveBatch, findRecentReport } from "@/lib/tools/store";
import { parseTargetUrl } from "@/lib/tools/url-guard";
import { isLocale, type Locale } from "@/lib/i18n/config";

/** N 个站点串行抓取，给足余量。 */
export const maxDuration = 300;

/** 与单页接口同一套预算，按 URL 逐个扣减。 */
const HOURLY = { windowMs: 3_600_000, max: 5 };
const DAILY = { windowMs: 86_400_000, max: 20 };

const CACHE_WINDOW_MS = 15 * 60_000;

/** 一批最多几个 URL。5 个恰好用满小时桶，也是一屏能读完的宽度。 */
export const MAX_BATCH_URLS = 5;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const rawList = Array.isArray(body.urls) ? body.urls : [];
  const inputs = rawList
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean);

  if (inputs.length < 2) {
    return NextResponse.json({ error: "too_few_urls" }, { status: 400 });
  }
  if (inputs.length > MAX_BATCH_URLS) {
    return NextResponse.json(
      { error: "too_many_urls", max: MAX_BATCH_URLS },
      { status: 400 },
    );
  }

  const locale: Locale =
    typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";

  // 入口校验先行：任一非法就整批拒绝，不做「跳过坏的继续跑」——
  // 用户提交 5 个却拿到 4 行的表，会以为漏掉的那个「没问题」。
  const targets: URL[] = [];
  for (const raw of inputs) {
    const parsed = parseTargetUrl(raw);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "invalid_url", reason: parsed.reason, url: raw },
        { status: 400 },
      );
    }
    targets.push(parsed.url);
  }

  // 同一批里重复提交同一个 URL 没有意义，且会白白消耗预算。
  const seen = new Set<string>();
  for (const t of targets) {
    if (seen.has(t.toString())) {
      return NextResponse.json({ error: "duplicate_url", url: t.toString() }, { status: 400 });
    }
    seen.add(t.toString());
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  const reportIds: string[] = [];
  // 串行而非并发：并发 5 路抓取对小站点是一次微型压测，且我们并不赶时间。
  for (const target of targets) {
    const url = target.toString();

    // 缓存命中不计入限频，与单页接口一致。
    const cached = await findRecentReport(url, locale, CACHE_WINDOW_MS);
    if (cached) {
      reportIds.push(cached.id);
      continue;
    }

    if (!(await allowRequest(bucketKey("pagecheck-h", ip), HOURLY))) {
      return NextResponse.json({ error: "rate_limited", scope: "hour" }, { status: 429 });
    }
    if (!(await allowRequest(bucketKey("pagecheck-d", ip), DAILY))) {
      return NextResponse.json({ error: "rate_limited", scope: "day" }, { status: 429 });
    }

    let report;
    try {
      report = await runPageCheck(url);
    } catch (e) {
      console.error("[page-check-batch] 检查失败", target.hostname, (e as Error).message);
      return NextResponse.json({ error: "check_failed", url }, { status: 502 });
    }

    try {
      reportIds.push(
        await saveReport({ report, inputUrl: url, host: target.hostname, locale, ip }),
      );
    } catch (e) {
      console.error("[page-check-batch] 报告落库失败", (e as Error).message);
      return NextResponse.json({ error: "store_failed" }, { status: 500 });
    }
  }

  try {
    const id = await saveBatch({ reportIds, locale, ip });
    return NextResponse.json({ id });
  } catch (e) {
    console.error("[page-check-batch] 批次落库失败", (e as Error).message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}
