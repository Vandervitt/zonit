import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { handleTenancy } from "@/lib/proxy/tenant-proxy";
import { handleAuth } from "@/lib/proxy/auth-proxy";
import { TENANT_HOST_HEADER } from "@/lib/host";

// export const runtime = "nodejs";

export const proxy = auth(async (req) => {
  // 1. Handle Multi-tenancy (Rewrites)
  const tenancyResponse = await handleTenancy(req);
  if (tenancyResponse) return tenancyResponse;

  // 2. Handle Auth & Authorization
  const authResponse = handleAuth(req);
  if (authResponse) return authResponse;

  // 未经租户改写的请求：剥除任何客户端伪造的 x-tenant-host，
  // 确保该头只可能由上面的 handleTenancy 设置，防止在 app 主域上冒充租户绕过 /p 守卫。
  if (req.headers.has(TENANT_HOST_HEADER)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete(TENANT_HOST_HEADER);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
});

export const config = {
  // 排除静态与约定式图标资源，避免匿名访客请求 favicon/品牌图标时被鉴权兜底重定向到 /login
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

export default proxy;
