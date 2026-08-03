// B 档实测确认：在 Vercel Sandbox 里起真实浏览器，测像素是否在同意前触发。
//
// **需登录**——这是 11.7 分层的另一半，也是这个工具的楔子转化点：
// 匿名侧只能拿到「疑似」，想要「实测」就得有账号。
//
// 三道闸门缺一不可：登录 → 月度预算（fail-closed）→ 每用户限频。
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { allowRequest, bucketKey } from "@/lib/rate-limit-db";
import { consumeSandboxBudget } from "@/lib/tools/sandbox-budget";
import { runSandboxCheck } from "@/lib/tools/sandbox-check";
import { getReport, saveReport } from "@/lib/tools/store";
import { applyBrowserVerification } from "@/lib/tools/report";
import { guardUrl } from "@/lib/tools/url-guard";

/** 沙箱冷启动最坏情况 ~30s，留足余量。 */
export const maxDuration = 120;

/** 单用户实测限频：这是要花钱的动作，比匿名检查严格得多。 */
const PER_USER = { windowMs: 3_600_000, max: 3 };

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const { id } = await params;
  const report = await getReport(id);
  if (!report) return NextResponse.json({ error: "report_not_found" }, { status: 404 });
  if (report.browserVerified) {
    return NextResponse.json({ id: report.id, alreadyVerified: true });
  }

  if (!(await allowRequest(bucketKey("sandbox-verify", userId), PER_USER))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // 预算守卫 fail-closed：数不清就不花钱，退回让用户继续用静态结论。
  const budget = await consumeSandboxBudget();
  if (!budget.allowed) {
    return NextResponse.json(
      { error: "budget_exhausted", reason: budget.reason },
      { status: 503 },
    );
  }

  // 沙箱虽是隔离环境，但没有理由让它去访问一个我们自己都不敢连的地址——
  // 这里对最终 URL 再过一次闸门（报告可能是几天前生成的，DNS 可能已变）。
  const target = report.finalUrl || report.inputUrl;
  const gate = await guardUrl(target);
  if (!gate.ok) {
    return NextResponse.json({ error: "url_not_allowed", reason: gate.reason }, { status: 400 });
  }

  const result = await runSandboxCheck(gate.url.toString());
  if (!result.ok) {
    console.error("[page-check] 实测失败", gate.url.hostname, result.error);
    return NextResponse.json({ error: "verify_failed", reason: result.error }, { status: 502 });
  }

  // 实测结果并入报告后**另存一份**：原报告可能已被分享出去，
  // 就地改写会让别人手里的链接内容悄悄变化。
  const verified = applyBrowserVerification(report, result.firedBeforeConsent);
  const newId = await saveReport({
    report: verified,
    inputUrl: report.inputUrl,
    host: gate.url.hostname,
    locale: report.locale,
    ip: "verified",
  });

  return NextResponse.json({ id: newId, firedBeforeConsent: result.firedBeforeConsent });
}
