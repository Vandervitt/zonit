import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";
import { hostnameOf, isCustomDomain, TENANT_HOST_HEADER } from "@/lib/host";

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
    // 「一域名一页」：页面只存在于根路径，其余路径本就不存在，必须 404。
    // 此前 rewrite 只用 host 查 slug、未读 pathname，导致任意路径都返回同一张
    // 落地页 HTML 200 —— 对搜索引擎是无限重复内容（canonical 指回根路径只是缓解，
    // 页面本身仍被抓取）。放行名单（/_next、元数据路由、访客 API）已在上方先行返回。
    if (req.nextUrl.pathname !== "/") {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 新流程：自定义域名 → 已发布落地页
    const landingSlug = await getLandingSlugByCustomDomain(hostname);
    if (landingSlug) {
      // 改写后下游的 host 会变成 app 主域，这里把真实客户域名透传给页面/metadata，
      // 使租户判定与 canonical 不依赖改写后被污染的 host。
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set(TENANT_HOST_HEADER, hostname);
      return NextResponse.rewrite(new URL(`/p/${landingSlug}`, req.url), {
        request: { headers: requestHeaders },
      });
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  return null;
}
