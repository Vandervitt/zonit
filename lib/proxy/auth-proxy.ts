import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/lib/constants";

export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pricing",
  "/p",
  "/robots.txt",
  "/sitemap.xml",
  "/api/auth",
  "/api/register",
  "/api/templates",
  "/api/track", // 公开采集端点：访客在租户域名匿名回传，无需登录
];

type ProxyAuth = {
  user?: {
    role?: UserRole;
  };
} | null;

export function handleAuth(req: NextRequest & { auth?: ProxyAuth }) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 营销首页：公开；已登录则进租户后台
  if (pathname === "/") {
    return isLoggedIn ? NextResponse.redirect(new URL("/admin", req.url)) : null;
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return null;

  // 线索公开提交：访客在落地页留资，POST /api/leads 无需登录（含预检 OPTIONS）；
  // 其余方法（GET 列表）及 /api/leads/[id]、/api/leads/export 仍走下方鉴权。
  if (pathname === "/api/leads" && (req.method === "POST" || req.method === "OPTIONS")) {
    return null;
  }

  // 平台后台：需 SUPER_ADMIN
  if (pathname.startsWith("/super-admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
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

  // 租户后台及其它页面：需登录
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return null;
}
