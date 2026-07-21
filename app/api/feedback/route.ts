import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import {
  createFeedback,
  FEEDBACK_SOURCES,
  type FeedbackSource,
  type FeedbackContext,
} from "@/lib/feedback";
import { getFounderContact } from "@/lib/platform-settings";
import { sendFeedbackNotificationEmail } from "@/lib/email";

const MAX_MESSAGE = 2000;
const MAX_FIELD = 500;

function clampStr(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  return t.slice(0, max);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const source = body.source as FeedbackSource;
  if (!FEEDBACK_SOURCES.includes(source)) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const message = clampStr(body.message, MAX_MESSAGE);
  if (!message) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  // 仅采纳已知上下文字段，避免存入任意载荷。
  const rawCtx = (body.context ?? {}) as Record<string, unknown>;
  const context: FeedbackContext = {
    pageId: clampStr(rawCtx.pageId, MAX_FIELD),
    pageName: clampStr(rawCtx.pageName, MAX_FIELD),
    url: clampStr(rawCtx.url, MAX_FIELD),
    errorId: clampStr(rawCtx.errorId, MAX_FIELD),
    reason: clampStr(rawCtx.reason, MAX_FIELD),
    plan: session.user.plan ?? undefined,
  };

  const email = session.user.email ?? null;
  await createFeedback({ userId: session.user.id, email, source, message, context });

  // 邮件通知创始人（best-effort，不阻断响应）。未配置联系邮箱则跳过。
  after(async () => {
    try {
      const { email: founderEmail } = await getFounderContact();
      if (!founderEmail) return;
      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      await sendFeedbackNotificationEmail({
        to: founderEmail,
        source,
        message,
        meta: {
          来自邮箱: email ?? "—",
          套餐: context.plan ?? "—",
          落地页: context.pageName ?? context.pageId ?? "—",
          快捷原因: context.reason ?? "—",
          页面: context.url ?? "—",
        },
        dashboardUrl: `${base}/super-admin/feedback`,
      });
    } catch (err) {
      console.error("feedback notify failed:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
