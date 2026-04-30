import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/lib/constants";

export const PUBLIC_PATHS = ["/login", "/register", "/pricing", "/api/auth", "/api/register", "/api/unsplash"];

export function handleAuth(req: NextRequest & { auth?: any }) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) return null;

  const isLoggedIn = !!req.auth;

  // Admin area protection
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (req.auth?.user?.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/", req.url));
    }
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

  // General page protection (dashboard, etc.)
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return null;
}
