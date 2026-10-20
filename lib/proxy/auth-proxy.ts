import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Routes, UserRole } from "@/lib/constants";
import { CALLBACK_PARAM, postLoginTarget, withCallbackUrl } from "@/lib/auth/callback-url";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/routes";

export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pricing",
  "/anti-ban", // 反同质化叙事页：营销公开页
  "/p",
  "/preview", // 草稿分享预览：凭签名 token 公开访问，无需登录
  "/robots.txt",
  "/sitemap.xml",
  "/api/auth",
  "/api/templates",
  "/api/track", // 公开采集端点：访客在租户域名匿名回传，无需登录
  // 落地页自检器：匿名可用是这个工具的全部意义（报告要能被转发传播）。
  // 安全性不靠登录态，靠 lib/tools/url-guard.ts 的 SSRF 闸门 + 双桶限频。
  "/api/tools",
  "/api/cron", // Vercel Cron 端点：由各路由的 CRON_SECRET Bearer 自行鉴权
  "/api/webhooks", // 支付渠道回调（Dodo/Creem）：服务器到服务器无登录态，靠各路由 standardwebhooks 签名验签鉴权
];

type ProxyAuth = {
  user?: {
    role?: UserRole;
  };
} | null;

/** 登录/注册入口（含 /zh 镜像）：已登录时统一跳转后台。 */
const AUTH_ENTRY_PATHS = new Set(["/login", "/register", "/zh/login", "/zh/register"]);

/**
 * 登录页语言：用户手动选过语言（cookie）则以其为准；否则看是否从本站 /zh 页面点进来。
 * 外站 referer 不参与判定，避免被任意站点左右。
 */
function loginLocale(req: NextRequest): "zh" | "en" {
  const chosen = req.cookies.get(LOCALE_COOKIE)?.value;
  if (chosen === "zh" || chosen === "en") return chosen;
  const referer = req.headers.get("referer");
  if (!referer) return "en";
  try {
    const from = new URL(referer);
    const sameSite = from.origin === new URL(req.url).origin;
    return sameSite && (from.pathname === "/zh" || from.pathname.startsWith("/zh/")) ? "zh" : "en";
  } catch {
    return "en";
  }
}

/** 未登录访问受保护页：带着原地址去登录，登录后回到原处（如模板深链 ?template=）。 */
function redirectToLogin(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const loginPath = withCallbackUrl(localePath(loginLocale(req), Routes.Login), `${pathname}${search}`);
  return NextResponse.redirect(new URL(loginPath, req.url));
}

export function handleAuth(req: NextRequest & { auth?: ProxyAuth }) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 营销首页：始终公开，已登录用户也正常展示，不再自动跳转租户后台
  if (pathname === "/") {
    return null;
  }

  // 已登录用户点登录/注册：直接进租户后台（仅此入口触发跳转）。
  // 含中文镜像路由——/zh/login 与 /login 是同一入口的两种语言版本。
  if (isLoggedIn && AUTH_ENTRY_PATHS.has(pathname)) {
    const target = postLoginTarget(req.nextUrl.searchParams.get(CALLBACK_PARAM));
    return NextResponse.redirect(new URL(target, req.url));
  }

  // 按路径段边界匹配（精确命中或其子路径），避免裸前缀误伤：
  // 例如 "/p" 不再顺带放行 "/pricing"/"/preview"（各有自己的公开条目），
  // 也避免将来出现 "/profile" 等同前缀受保护路由被意外公开。
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return null;

  // 线索公开提交：访客在落地页留资，POST /api/leads 无需登录（含预检 OPTIONS）；
  // 其余方法（GET 列表）及 /api/leads/[id]、/api/leads/export 仍走下方鉴权。
  if (pathname === "/api/leads" && (req.method === "POST" || req.method === "OPTIONS")) {
    return null;
  }

  // 平台后台：需 SUPER_ADMIN
  if (pathname.startsWith("/super-admin")) {
    if (!isLoggedIn) {
      return redirectToLogin(req);
    }
    if (req.auth?.user?.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return null;
  }

  // API protection (non-public)
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }
    return null;
  }

  // 租户后台（/admin 树）：需登录。仅对受保护前缀跳登录，
  // 其余未登记路径一律放行交给 Next 渲染——未知路由由此命中 app/not-found（404），
  // 不再被误重定向到 /login（受保护页仅 /admin 与上方 /super-admin 两棵树）。
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isLoggedIn) {
      return redirectToLogin(req);
    }
    return null;
  }

  return null;
}
