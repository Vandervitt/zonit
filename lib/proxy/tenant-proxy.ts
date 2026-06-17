import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSlugByCustomDomain } from "@/lib/domains-db";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";

const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

export async function handleTenancy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (appHostname && hostname !== appHostname && !hostname.endsWith(`.${appHostname}`)) {
    // 新流程：自定义域名 → 已发布落地页
    const landingSlug = await getLandingSlugByCustomDomain(hostname);
    if (landingSlug) {
      return NextResponse.rewrite(new URL(`/p/${landingSlug}`, req.url));
    }
    // 回落：旧 sites
    const slug = await getSlugByCustomDomain(hostname);
    if (slug) {
      return NextResponse.rewrite(new URL(`/site/${slug}`, req.url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  return null;
}
