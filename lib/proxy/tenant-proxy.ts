import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";

const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

export async function handleTenancy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Next 内部资源（客户端运行时 chunk、HMR、RSC 数据流等）一律不按租户改写，
  // 否则会把 /_next/webpack-hmr 等改写成 /p/{slug} 页面，导致客户端运行时无法启动、页面不水合。
  if (req.nextUrl.pathname.startsWith("/_next/")) return null;

  if (appHostname && hostname !== appHostname && !hostname.endsWith(`.${appHostname}`)) {
    // 新流程：自定义域名 → 已发布落地页
    const landingSlug = await getLandingSlugByCustomDomain(hostname);
    if (landingSlug) {
      return NextResponse.rewrite(new URL(`/p/${landingSlug}`, req.url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  return null;
}
