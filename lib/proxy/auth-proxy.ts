import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/lib/constants";

export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pricing",
  "/preview-next",
  "/p",
  "/robots.txt",
  "/sitemap.xml",
  "/api/auth",
  "/api/register",
  "/api/templates",
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
