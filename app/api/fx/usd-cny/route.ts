import { NextResponse } from "next/server";
import { getUsdToCnyRate } from "@/lib/pricing/fx-server";

/**
 * USD→CNY 展示汇率。仅供 /admin/billing 等纯客户端页取参考换算用；
 * 服务端渲染的营销页直接调 getUsdToCnyRate，不必绕这一跳。
 *
 * 走 proxy 的默认 /api 鉴权（需登录）——唯一调用方是登录后的计费页，
 * 无需放进 PUBLIC_PATHS 扩大公开面。
 */
export async function GET() {
  const rate = await getUsdToCnyRate();
  return NextResponse.json(
    { rate },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
