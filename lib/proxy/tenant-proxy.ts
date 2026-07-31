import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantRoute } from "@/lib/domains-db";
import { isReservedRoutePath, normalizeRoutePath } from "@/lib/domains/route-path";
import { hostnameOf, isCustomDomain, TENANT_HOST_HEADER, TENANT_PATH_HEADER } from "@/lib/host";

// 这些公开元数据路由按 host 自行生成（app/robots.ts、app/sitemap.ts、
// app/llms.txt），不能被改写到 /p/{slug}，否则会返回落地页 HTML 而非
// robots/sitemap/llms.txt。租户域上 /llms.txt 由路由处理器自行返回 404（Phase B 再做租户版）。
const METADATA_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

// 访客在租户域名上第一方调用的公开 API（留资/埋点）。改写会把 POST 吞成
// 落地页 HTML 200，客户端 res.ok 误判成功而数据静默丢失，故必须放行；
// 仅列访客端点，其余 /api 维持改写，暴露面保持最小。
const PUBLIC_TENANT_API_PATHS = new Set(["/api/leads", "/api/track"]);

export async function handleTenancy(req: NextRequest) {
  const hostname = hostnameOf(req.headers.get("host"));

  // Next 内部资源（客户端运行时 chunk、HMR、RSC 数据流等）一律不按租户改写，
  // 否则会把 /_next/webpack-hmr 等改写成 /p/{slug} 页面，导致客户端运行时无法启动、页面不水合。
  if (req.nextUrl.pathname.startsWith("/_next/")) return null;
  if (METADATA_PATHS.has(req.nextUrl.pathname)) return null;
  if (PUBLIC_TENANT_API_PATHS.has(req.nextUrl.pathname)) return null;

  if (isCustomDomain(hostname)) {
    const path = normalizeRoutePath(req.nextUrl.pathname);

    // 形状不合法（超长、非法字符、超过 2 段）的路径不可能有绑定，直接 404，不查库。
    // 保留路径同理：即使客户绕过发布校验写进了库，也不允许它遮蔽平台自有路由。
    if (!path || isReservedRoutePath(path)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 自定义域名 + 路径 → 已发布落地页。未绑定的路径 404（不 fallback 到根页，
    // 见设计决策 D6：静默 fallback 会让每个错误路径都变成一份重复内容）。
    const landingSlug = await resolveTenantRoute(hostname, path);
    if (landingSlug) {
      // 改写后下游的 host 会变成 app 主域、pathname 会变成 /p/{slug}，
      // 这里把真实客户域名与原始路径透传给页面/metadata，
      // 使租户判定与 canonical 不依赖被改写污染的 host / path。
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set(TENANT_HOST_HEADER, hostname);
      requestHeaders.set(TENANT_PATH_HEADER, path);
      return NextResponse.rewrite(new URL(`/p/${landingSlug}`, req.url), {
        request: { headers: requestHeaders },
      });
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  return null;
}
