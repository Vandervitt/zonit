import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSlugByCustomDomain } from "@/lib/domains-db";

export const runtime = "nodejs";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/register"];

const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Custom domain: not our own app domain
  if (appHostname && hostname !== appHostname && !hostname.endsWith(`.${appHostname}`)) {
    const slug = await getSlugByCustomDomain(hostname);
    if (slug) {
      return NextResponse.rewrite(new URL(`/site/${slug}`, request.url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // Normal app: existing auth logic
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
