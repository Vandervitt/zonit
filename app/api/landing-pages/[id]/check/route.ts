// 后台侧的落地页自检：对自己已发布的页跑一次公开自检器，产出同一种报告。
//
// 为什么要有这个入口：自检器原来只挂在营销站，是给「被拒审后搜进来」的匿名访客用的。
// 但同一个人注册之后，在后台发布自己的页时反而没有这一步——获客路径进来了，
// 闭环却断在门口。这里复用完全相同的检查逻辑，只是把 URL 从「用户手输」换成
// 「你这张页的线上地址」，省掉复制粘贴，也杜绝检查错页。
//
// 与匿名入口的区别只有两点：鉴权 + 限频桶。检查逻辑一字不改，
// 否则后台说「没问题」而营销站说「有问题」，两个结论打架谁也不信。
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { allowRequest, bucketKey } from "@/lib/rate-limit-db";
import { runPageCheck } from "@/lib/tools/run-check";
import { saveReport, findRecentReport } from "@/lib/tools/store";
import { parseTargetUrl } from "@/lib/tools/url-guard";
import { listLandingPages } from "@/lib/landing-pages/store";
import { resolveLiveUrl } from "@/lib/landing-pages/live-url";
import { isLocale, type Locale } from "@/lib/i18n/config";

/** 抓取外站需要时间，给足余量（与匿名入口一致）。 */
export const maxDuration = 60;

/**
 * 登录侧限频按用户计。比匿名宽松（检查的是自己的页，滥用面小），
 * 但仍必须有上限——每次检查都会向外发数个请求。
 */
const PER_USER = { windowMs: 3_600_000, max: 30 };

/** 同一 URL 的结果复用窗口，与匿名入口同口径。 */
const CACHE_WINDOW_MS = 15 * 60_000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await params;

  // 经列表查询取页面，顺带拿到绑定域名与路径（自检必须打在访客真正看到的地址上）。
  const page = (await listLandingPages(session.user.id)).find((p) => p.id === id);
  if (!page) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  const live = resolveLiveUrl(page);
  if (!live.ok) return NextResponse.json({ error: live.reason }, { status: 400 });

  // 线上地址理论上都是自家域名，但仍走同一道 SSRF 闸门：域名由用户绑定，
  // 绑定环节之后 DNS 随时可能被改指到内网地址。
  const parsed = parseTargetUrl(live.url);
  if (!parsed.ok) return NextResponse.json({ error: "invalid_url", reason: parsed.reason }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const locale: Locale = typeof body?.locale === "string" && isLocale(body.locale) ? body.locale : "zh";

  // 缓存命中不计入限频：刚查过又点一次不该被惩罚。
  const cached = await findRecentReport(parsed.url.toString(), locale, CACHE_WINDOW_MS);
  if (cached) return NextResponse.json({ id: cached.id, cached: true, url: live.url });

  if (!(await allowRequest(bucketKey("pagecheck-user", session.user.id), PER_USER))) {
    return NextResponse.json({ error: "rate_limited", scope: "hour" }, { status: 429 });
  }

  let report;
  try {
    report = await runPageCheck(parsed.url.toString());
  } catch (e) {
    console.error("[page-check/admin] 检查失败", parsed.url.hostname, (e as Error).message);
    return NextResponse.json({ error: "check_failed" }, { status: 502 });
  }

  try {
    const reportId = await saveReport({
      report,
      inputUrl: parsed.url.toString(),
      host: parsed.url.hostname,
      locale,
      ip: (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown",
    });
    return NextResponse.json({ id: reportId, cached: false, url: live.url });
  } catch (e) {
    console.error("[page-check/admin] 报告落库失败", (e as Error).message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}
