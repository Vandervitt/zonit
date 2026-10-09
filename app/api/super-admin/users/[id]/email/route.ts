import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { UserRole, ApiErrors } from "@/lib/constants";
import { sendAdminDirectEmail } from "@/lib/email";
import { addUserNote } from "@/lib/super-admin/users-db";
import { getFounderContact } from "@/lib/platform-settings";

const MAX_SUBJECT = 200;
const MAX_BODY = 10_000;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 403 });
  }
  const { id } = await ctx.params;
  const payload = await req.json().catch(() => null);
  const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  if (!subject || !body || subject.length > MAX_SUBJECT || body.length > MAX_BODY) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  // 收件人只从库里取：这个接口能以平台名义发信，绝不能让请求体决定发给谁。
  const userRes = await pool.query(`SELECT email, disabled_at FROM users WHERE id = $1`, [id]);
  const user = userRes.rows[0];
  if (!user) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  if (user.disabled_at) return NextResponse.json({ error: "user_disabled" }, { status: 409 });

  const founder = await getFounderContact();
  const r = await sendAdminDirectEmail({ to: user.email, subject, text: body, replyTo: founder.email || null });
  if (!("success" in r && r.success)) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  // 发出才记，失败不记：备注里写了「已发」，就必须真的发了。
  await addUserNote(id, session.user.id, `发送邮件：${subject}`);
  return NextResponse.json({ ok: true });
}
