import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { handleTenancy } from "@/lib/proxy/tenant-proxy";
import { handleAuth } from "@/lib/proxy/auth-proxy";

// export const runtime = "nodejs";

export const proxy = auth(async (req) => {
  // 1. Handle Multi-tenancy (Rewrites)
  const tenancyResponse = await handleTenancy(req);
  if (tenancyResponse) return tenancyResponse;

  // 2. Handle Auth & Authorization
  const authResponse = handleAuth(req);
  if (authResponse) return authResponse;

  return NextResponse.next();
});

export const config = {
  // 排除静态与约定式图标资源，避免匿名访客请求 favicon/品牌图标时被鉴权兜底重定向到 /login
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

export default proxy;
