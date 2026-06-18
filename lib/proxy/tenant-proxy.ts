import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";
import { hostnameOf, isCustomDomain } from "@/lib/host";

// 这些公开元数据路由按 host 自行生成（app/robots.ts、app/sitemap.ts），
// 不能被改写到 /p/{slug}，否则会返回落地页 HTML 而非 robots/sitemap。
const METADATA_PATHS = new Set(["/robots.txt", "/sitemap.xml"]);

export async function handleTenancy(req: NextRequest) {
  const hostname = hostnameOf(req.headers.get("host"));

  // Next 内部资源（客户端运行时 chunk、HMR、RSC 数据流等）一律不按租户改写，
  // 否则会把 /_next/webpack-hmr 等改写成 /p/{slug} 页面，导致客户端运行时无法启动、页面不水合。
  if (req.nextUrl.pathname.startsWith("/_next/")) return null;
  if (METADATA_PATHS.has(req.nextUrl.pathname)) return null;

  if (isCustomDomain(hostname)) {
    // 新流程：自定义域名 → 已发布落地页
    const landingSlug = await getLandingSlugByCustomDomain(hostname);
    if (landingSlug) {
      return NextResponse.rewrite(new URL(`/p/${landingSlug}`, req.url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  return null;
}
