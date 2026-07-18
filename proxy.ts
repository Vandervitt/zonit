import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent, NextMiddleware } from "next/server";
import { handleTenancy } from "@/lib/proxy/tenant-proxy";
import { handleAuth } from "@/lib/proxy/auth-proxy";
import { TENANT_HOST_HEADER } from "@/lib/host";

// export const runtime = "nodejs";

// 鉴权段仍走 NextAuth 包装（需要 req.auth）。auth() 的重载在传单参回调时会被
// 推断为路由处理器；此处实际用作中间件，显式收敛为 NextMiddleware。
const authProxy = auth((req) => {
  const authResponse = handleAuth(req);
  if (authResponse) return authResponse;

  // 未经租户改写的请求：剥除任何客户端伪造的 x-tenant-host，
  // 确保该头只可能由 handleTenancy 设置，防止在 app 主域上冒充租户绕过 /p 守卫。
  if (req.headers.has(TENANT_HOST_HEADER)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete(TENANT_HOST_HEADER);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

// 多租户改写必须在 auth() 之外直接返回：NextAuth 包装器会用
// `new Response(body, response)` 重建响应，丢弃 rewrite 附带的上游请求头覆盖
// （x-tenant-host），导致下游页面读不到真实租户域名而 404。
export async function proxy(req: NextRequest, ctx: NextFetchEvent) {
  const tenancyResponse = await handleTenancy(req);
  if (tenancyResponse) return tenancyResponse;

  return authProxy(req, ctx);
}

export const config = {
  // 排除静态与约定式图标资源，避免匿名访客请求 favicon/品牌图标时被鉴权兜底重定向到 /login
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

export default proxy;
