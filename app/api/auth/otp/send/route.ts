import { NextRequest, NextResponse, after } from "next/server";
import { ApiErrors } from "@/lib/constants";
import { isValidEmailFormat } from "@/lib/auth/trusted-email";
import { issueOtp, normalizeEmail } from "@/lib/auth/otp";
import { createRateLimiter } from "@/lib/leads/rate-limit";
import { sendOtpEmail } from "@/lib/email";

// 内存限流第一层：每 IP 每分钟最多 5 次发码请求（跨实例可靠性由 DB 冷却兜底）。
const ipRateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";

  if (!isValidEmailFormat(email)) {
    return NextResponse.json({ error: ApiErrors.EMAIL_INVALID }, { status: 400 });
  }

  if (!ipRateLimiter.allow(clientIp(request))) {
    // 429：请求过于频繁，前端提示稍后再试。
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const result = await issueOtp(email);

  // 冷却期内：不重发但也不泄露差异——统一按成功返回，避免探测。
  // 仅在 DB 冷却命中时跳过发信。
  if ("error" in result) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 发信 best-effort，绝不因发信失败泄露邮箱是否存在或阻断流程。
  after(async () => {
    try {
      await sendOtpEmail({ to: normalizeEmail(email), code: result.code });
    } catch (err) {
      console.error("otp email send failed:", err);
    }
  });

  // dev 环境回传验证码，供本地联调与 E2E 断言；生产绝不回传。
  const devCode =
    process.env.NODE_ENV !== "production" ? { devCode: result.code } : {};

  return NextResponse.json({ ok: true, ...devCode }, { status: 200 });
}
