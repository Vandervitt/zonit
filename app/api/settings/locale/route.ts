import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

/**
 * 保存后台界面语言。
 *
 * 同时写 DB 与 `zb_locale` cookie：DB 是账号级事实源（跨设备、且邮件发送侧唯一能读到的地方），
 * cookie 则让营销站的语言与后台保持一致——用户在后台切成英文后回到营销站首页，
 * 不该再被 IP 分流弹回中文（见 lib/proxy/locale-proxy.ts 的 cookie 优先逻辑）。
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const locale = body.locale;
  if (typeof locale !== "string" || !isLocale(locale)) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  await pool.query("UPDATE users SET locale = $1 WHERE id = $2", [locale, session.user.id]);

  const res = NextResponse.json({ locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
